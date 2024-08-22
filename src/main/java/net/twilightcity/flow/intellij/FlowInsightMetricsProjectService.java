package net.twilightcity.flow.intellij;

import com.intellij.execution.ExecutionListener;
import com.intellij.execution.ExecutionManager;
import com.intellij.execution.process.ProcessHandler;
import com.intellij.execution.runners.ExecutionEnvironment;
import com.intellij.openapi.Disposable;
import com.intellij.openapi.components.Service;
import com.intellij.openapi.editor.Document;
import com.intellij.openapi.editor.event.DocumentEvent;
import com.intellij.openapi.editor.event.DocumentListener;
import com.intellij.openapi.fileEditor.FileDocumentManager;
import com.intellij.openapi.fileEditor.FileEditorManager;
import com.intellij.openapi.fileEditor.FileEditorManagerEvent;
import com.intellij.openapi.fileEditor.FileEditorManagerListener;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.vfs.VirtualFile;
import com.intellij.util.messages.MessageBusConnection;
import net.twilightcity.flow.controller.IFMController;
import net.twilightcity.flow.intellij.handler.ProcessExecutionHandler;
import net.twilightcity.flow.intellij.handler.VirtualFileActivityHandler;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

@Service(Service.Level.PROJECT)
public final class FlowInsightMetricsProjectService implements Disposable {

    public static FlowInsightMetricsProjectService getInstance(Project project) {
        return project.getService(FlowInsightMetricsProjectService.class);
    }

    private Project project;
    private MessageBusConnection projectConnection;
    private FileModificationAdapter fileModificationAdapter;
    private VirtualFileActivityHandler virtualFileActivityHandler;

    public FlowInsightMetricsProjectService(Project project) {
        this.project = project;
        this.projectConnection = project.getMessageBus().connect();
        this.fileModificationAdapter = new FileModificationAdapter();
        IFMController controller = FlowInsightMetricsAppService.getInstance().getController();
        this.virtualFileActivityHandler = new VirtualFileActivityHandler(controller.getActivityHandler(),
                controller.getModuleManager(), controller.getLastLocationTracker());
    }

    public void onProjectOpen() {
        projectConnection.subscribe(FileEditorManagerListener.FILE_EDITOR_MANAGER, new FileListener());
        projectConnection.subscribe(ExecutionManager.EXECUTION_TOPIC, new ProcessExecutionListener());
    }

    @Override
    public void dispose() {
        projectConnection.dispose();
    }

    public void startFileEvent(@Nullable VirtualFile file) {
        virtualFileActivityHandler.startFileEvent(project, file);
        if (file != null) {
            fileModificationAdapter.setActiveFile(file);
        }
    }

    public void endFileEvent(@NotNull VirtualFile file) {
        virtualFileActivityHandler.endFileEvent(project, file);
    }

    public void fileModified(@NotNull VirtualFile file) {
        virtualFileActivityHandler.fileModified(project, file);
    }

    private class FileListener implements FileEditorManagerListener {

        @Override
        public void fileClosed(@NotNull FileEditorManager source, @NotNull VirtualFile file) {
            endFileEvent(file);
        }

        @Override
        public void selectionChanged(@NotNull FileEditorManagerEvent event) {
            startFileEvent(event.getNewFile());
        }

    }

    private class FileModificationAdapter implements DocumentListener {

        private VirtualFile activeFile;
        private Document activeDocument;

        void setActiveFile(@NotNull VirtualFile file) {
            clearActiveFile();

            Document document = FileDocumentManager.getInstance().getCachedDocument(file);
            if (document != null) {
                activeFile = file;
                activeDocument = document;
                activeDocument.addDocumentListener(this);
            }
        }

        private void clearActiveFile() {
            if (activeDocument != null) {
                activeDocument.removeDocumentListener(this);
            }
            activeDocument = null;
            activeFile = null;
        }

        @Override
        public void documentChanged(@NotNull DocumentEvent event) {
            if (activeFile != null) {
                fileModified(activeFile);
            }
        }

    }

    private static class ProcessExecutionListener implements ExecutionListener {

        private ProcessExecutionHandler handler;

        ProcessExecutionListener() {
            IFMController controller = FlowInsightMetricsAppService.getInstance().getController();
            this.handler = new ProcessExecutionHandler(controller);
        }

        @Override
        public void processStarting(@NotNull String executorId, @NotNull ExecutionEnvironment env) {
            handler.processStarting(executorId, env);
        }

        @Override
        public void processStarted(@NotNull String executorId, @NotNull ExecutionEnvironment env, @NotNull ProcessHandler processHandler) {
            handler.processStarted(env, processHandler);
        }

        @Override
        public void processTerminated(@NotNull String executorId, @NotNull ExecutionEnvironment env, @NotNull ProcessHandler processHandler, int exitCode) {
            handler.processTerminated(processHandler);
        }

    }

}
