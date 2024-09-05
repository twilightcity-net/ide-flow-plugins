package net.twilightcity.flow.activity;

import net.twilightcity.flow.config.ModuleManager;
import net.twilightcity.gridtime.api.flow.activity.NewEditorActivityDto;
import net.twilightcity.gridtime.api.flow.activity.NewExecutionActivityDto;
import net.twilightcity.gridtime.api.flow.activity.NewExternalActivityDto;
import net.twilightcity.gridtime.api.flow.activity.NewModificationActivityDto;
import net.twilightcity.gridtime.api.flow.batch.NewFlowBatchEventDto;
import net.twilightcity.gridtime.api.flow.event.EventType;
import net.twilightcity.time.TimeService;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;

public class MessageQueue {

    private ModuleManager moduleManager;
    private MessageLogger messageLogger;
    private TimeService timeService;

    public MessageQueue(TimeService timeService, ModuleManager moduleManager, File activeFlowFile) {
        this(new FileMessageLogger(activeFlowFile), timeService, moduleManager);
    }

    public MessageQueue(MessageLogger messageLogger, TimeService timeService, ModuleManager moduleManager) {
        this.messageLogger = messageLogger;
        this.timeService = timeService;
        this.moduleManager = moduleManager;
    }

    public void flush() {
        messageLogger.flush();
    }

    public void pushEditorActivity(Long durationInSeconds, String filePath, String module, boolean isModified) {
        pushEditorActivity(durationInSeconds, timeService.now(), filePath, module, isModified);
    }

    public void pushEditorActivity(Long durationInSeconds, LocalDateTime endTime, String filePath, String module, boolean isModified) {
        if (moduleManager.isModuleEnabled(module)) {
            NewEditorActivityDto activity = NewEditorActivityDto.builder()
                    .module(module)
                    .endTime(endTime)
                    .durationInSeconds(durationInSeconds)
                    .filePath(filePath)
                    .isModified(isModified)
                    .build();

            messageLogger.writeMessage(activity);
        }
    }

    public void pushModificationActivity(Long durationInSeconds, int modificationCount) {
        NewModificationActivityDto activity = NewModificationActivityDto.builder()
                .endTime(timeService.now())
                .durationInSeconds(durationInSeconds)
                .modificationCount(modificationCount)
                .build();

        messageLogger.writeMessage(activity);
    }

    public void pushExecutionActivity(Long durationInSeconds, String processName,
                                      int exitCode,
                                      String executionTaskType,
                                      boolean isDebug) {
        NewExecutionActivityDto activity = NewExecutionActivityDto.builder()
                .durationInSeconds(durationInSeconds)
                .endTime(timeService.now())
                .processName(processName)
                .exitCode(exitCode)
                .executionTaskType(executionTaskType)
                .isDebug(isDebug)
                .build();

        messageLogger.writeMessage(activity);
    }

    public void pushExternalActivity(Long durationInSeconds, String comment) {
        NewExternalActivityDto activity = NewExternalActivityDto.builder()
                .endTime(timeService.now())
                .durationInSeconds(durationInSeconds)
                .comment(comment)
                .build();

        messageLogger.writeMessage(activity);
    }

    public void pushEvent(EventType eventType, String message) {
        NewFlowBatchEventDto batchEvent = NewFlowBatchEventDto.builder()
                .position(timeService.now())
                .type(eventType)
                .comment(message)
                .build();

        messageLogger.writeMessage(batchEvent);
    }


    static class FileMessageLogger implements MessageLogger {
        private final File activeFlowFile;

        private final Object lock = new Object();
        private JSONConverter jsonConverter = new JSONConverter();

        FileMessageLogger(File activeFlowFile) {
            this.activeFlowFile = activeFlowFile;
        }

        public void flush() {
            //no-op since the FlowInsight app will be handling this now
        }

        public void writeMessage(Object message) {
            try {
                String messageAsJson = jsonConverter.toJSON(message);

                synchronized (lock) {
                    appendLineToFile(activeFlowFile, messageAsJson);
                }
            } catch (IOException ex) {
                throw new RuntimeException(ex);
            }
        }

        private void appendLineToFile(File file, String text) throws IOException {
            try (PrintWriter printWriter = new PrintWriter(new FileWriter(file, true))) {
                printWriter.println(text);
            }
        }



    }

}
