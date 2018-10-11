package org.dreamscale.flow.intellij.handler;

import com.intellij.openapi.project.Project;
import com.intellij.openapi.ui.Messages;
import org.dreamscale.flow.activity.ActivityHandler;
import org.dreamscale.flow.controller.IFMController;
import org.dreamscale.flow.intellij.IdeaFlowApplicationComponent;
import org.dreamscale.time.TimeConverter;

import java.time.Duration;

public class DeactivationHandler {

    private static final String IDLE_TITLE = "Idle Time?";

    private static final Duration DEACTIVATION_THRESHOLD = Duration.ofMinutes(50);
    private static final Duration AUTO_IDLE_THRESHOLD = Duration.ofHours(8);

    private ActivityHandler activityHandler;
    private Long deactivatedAt;
    private boolean promptingForIdleTime;

    public DeactivationHandler(IFMController controller) {
        this.activityHandler = controller.getActivityHandler();
    }

    public boolean isPromptingForIdleTime() {
        return promptingForIdleTime;
    }

    public void deactivated() {
        deactivatedAt = System.currentTimeMillis();
    }

    public void markActiveFileEventAsIdleIfDeactivationThresholdExceeded(Project project) {
        Duration deactivationDuration = getDeactivationDuration();
        if (deactivationDuration == null) {
            return;
        }

        promptingForIdleTime = true;
        try {
            if (deactivationDuration.compareTo(AUTO_IDLE_THRESHOLD) > 0) {
                activityHandler.markIdleTime(deactivationDuration);
            } else if (deactivationDuration.compareTo(DEACTIVATION_THRESHOLD) > 0) {
                boolean wasIdleTime = wasDeactivationIdleTime(project, deactivationDuration);
                if (wasIdleTime) {
                    activityHandler.markIdleTime(deactivationDuration);
                } else {
                    String comment = IdeaFlowApplicationComponent.promptForInput("External Activity Comment", "What were you doing?");
                    activityHandler.markExternalActivity(deactivationDuration, comment);
                }
            } else {
                activityHandler.markExternalActivity(deactivationDuration, null);
            }
        } finally {
            deactivatedAt = null;
            promptingForIdleTime = false;
        }
    }

    private Duration getDeactivationDuration() {
        Duration deactivationDuration = null;

        if (deactivatedAt != null) {
            long deactivationLength = System.currentTimeMillis() - deactivatedAt;
            deactivationDuration = Duration.ofMillis(deactivationLength);
        }
        return deactivationDuration;
    }

    private boolean wasDeactivationIdleTime(Project project, Duration deactivationDuration) {
        String formattedPeriod = TimeConverter.toFormattedDuration(deactivationDuration);
        StringBuilder messageBuilder = new StringBuilder();
        messageBuilder.append("Were you working during the last " + formattedPeriod + "?");
        int result = Messages.showYesNoDialog(project, messageBuilder.toString(), IDLE_TITLE, null);
        return result != 0;
    }

}
