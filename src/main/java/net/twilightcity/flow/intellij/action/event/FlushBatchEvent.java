package net.twilightcity.flow.intellij.action.event;

import com.intellij.openapi.actionSystem.AnAction;
import com.intellij.openapi.actionSystem.AnActionEvent;
import com.intellij.openapi.ui.Messages;
import net.twilightcity.flow.controller.IFMController;
import net.twilightcity.flow.intellij.FlowInsightMetricsAppService;
import net.twilightcity.flow.intellij.Logger;
import net.twilightcity.flow.intellij.action.ActionSupport;

public class FlushBatchEvent extends AnAction {

    public static final Logger log = new Logger();

    @Override
    public void actionPerformed(AnActionEvent anActionEvent) {
        IFMController controller = ActionSupport.getIFMController(anActionEvent);
        if (controller != null) {
            if (controller.isActive() == false) {
                try {
                    controller.start();
                } catch (Exception ex) {
                    log.error("Failed to initialize Flow component", ex);
                    Messages.showErrorDialog(ex.getMessage(), "Failed to Initialize Flow Component");
                }
            }
            if (controller.isActive()) {
                try {
                    controller.flushBatch();
                } catch (Exception ex) {
                    log.error("Failed to flush Flow events", ex);
                    Messages.showErrorDialog(ex.getMessage(), "Failed to Flush Flow Events");
                }
            }
        }
    }

}
