package net.twilightcity.flow.intellij.handler;

import net.twilightcity.flow.activity.ActivityHandler;
import net.twilightcity.flow.controller.IFMController;

import java.time.Duration;

public class DeactivationHandler {

    private static final Duration DEACTIVATION_THRESHOLD = Duration.ofMinutes(1);

    private IFMController controller;
    private ActivityHandler activityHandler;
    private Long deactivatedAt;

    public DeactivationHandler(IFMController controller) {
        this.controller = controller;
        this.activityHandler = controller.getActivityHandler();
    }

    public void activated() {
        if (controller.isInactive()) {
            return;
        }

        Duration deactivationDuration = getDeactivationDuration();
        if (deactivationDuration == null) {
            return;
        }

        if (deactivationDuration.compareTo(DEACTIVATION_THRESHOLD) > 0) {
            activityHandler.markExternalActivity(deactivationDuration, "Editor Deactivated");
        }
    }

    public void deactivated() {
        deactivatedAt = System.currentTimeMillis();
    }

    private Duration getDeactivationDuration() {
        Duration deactivationDuration = null;

        if (deactivatedAt != null) {
            long deactivationLength = System.currentTimeMillis() - deactivatedAt;
            deactivationDuration = Duration.ofMillis(deactivationLength);
        }
        return deactivationDuration;
    }

}
