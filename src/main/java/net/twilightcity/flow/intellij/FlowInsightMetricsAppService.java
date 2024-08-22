package net.twilightcity.flow.intellij;

import com.intellij.openapi.Disposable;
import com.intellij.openapi.application.ApplicationActivationListener;
import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.components.Service;
import com.intellij.openapi.fileEditor.FileEditor;
import com.intellij.openapi.fileEditor.FileEditorManager;
import com.intellij.openapi.ui.Messages;
import com.intellij.openapi.vfs.VirtualFile;
import com.intellij.openapi.wm.IdeFrame;
import net.twilightcity.flow.controller.IFMController;
import net.twilightcity.flow.intellij.handler.DeactivationHandler;
import org.jetbrains.annotations.NotNull;

import java.awt.*;
import java.beans.PropertyChangeEvent;
import java.beans.PropertyChangeListener;

@Service
public final class FlowInsightMetricsAppService implements Disposable {

    public static FlowInsightMetricsAppService getInstance() {
        return ApplicationManager.getApplication().getService(FlowInsightMetricsAppService.class);
    }

    public static final Logger log = Logger.INSTANCE;

    private static final String FOCUSED_WINDOW_EVENT = "focusedWindow";

    private IFMController controller;
    private DeactivationHandler deactivationHandler;

    public FlowInsightMetricsAppService() {
        this.controller = new IFMController(log);
        this.deactivationHandler = new DeactivationHandler(controller);

//        controller.getFervieActionProcessor().startWatchLoop();

        try {
            controller.start();
        } catch (Exception ex) {
            log.error("Disabling FlowInsight Metrics Plugin due to controller initialization failure: "
                    + ex.getMessage(), ex.getCause());
            ApplicationManager.getApplication().invokeLater(() -> Messages.showMessageDialog(
                    "Disabling FlowInsight Metrics Plugin due to controller initialization failure: "
                            + ex.getMessage() + "\nSee IDEA logs for further details",
                    "FlowInsight Initialization Failed",
                    Messages.getInformationIcon()
            ));
        }

        KeyboardFocusManager.getCurrentKeyboardFocusManager().addPropertyChangeListener(
                FOCUSED_WINDOW_EVENT, new FocusChangeEventListener()
        );

//        fervieExtensionPointService = new FervieExtensionPointService(controller.getFervieActionConfigManager());
//        fervieExtensionPointService.initRegisteredExtensions();
//
//        gotoFileActionHandler = new GotoFileActionHandler(log);
//
//        this.fervieActionDispatcher = new FervieActionDispatcher(log, fervieExtensionPointService, gotoFileActionHandler);
//        this.controller.configureActionDispatcher(this.fervieActionDispatcher);
    }

    @Override
    public void dispose() {
//        controller.getFervieActionProcessor().exitWatchLoop();
        controller.shutdown();
    }

    public IFMController getController() {
        return controller;
    }

    private static VirtualFile getSelectedFile(IdeFrame ideFrame) {
        if (ideFrame.getProject() != null) {
            FileEditorManager editorManager = FileEditorManager.getInstance(ideFrame.getProject());
            if (editorManager != null) {
                FileEditor selectedEditor = editorManager.getSelectedEditor();
                if (selectedEditor != null) {
                    return selectedEditor.getFile();
                }
            }
        }
        return null;
    }

    static void activateIdeFrame(IdeFrame ideFrame) {
        VirtualFile selectedFile = getSelectedFile(ideFrame);
        if (selectedFile != null) {
            FlowInsightMetricsProjectService.getInstance(ideFrame.getProject())
                    .startFileEvent(selectedFile);
        }
    }

    static void activateApplication(IdeFrame ideFrame) {
        getInstance().deactivationHandler.activated();
        activateIdeFrame(ideFrame);
    }

    static void deactivateApplication(IdeFrame ideFrame) {
        getInstance().deactivationHandler.deactivated();
        VirtualFile selectedFile = getSelectedFile(ideFrame);
        if (selectedFile != null) {
            FlowInsightMetricsProjectService.getInstance(ideFrame.getProject())
                    .endFileEvent(selectedFile);
        }
    }

    private static class FocusChangeEventListener implements PropertyChangeListener {

        @Override
        public void propertyChange(PropertyChangeEvent evt) {
            if (evt.getNewValue() instanceof IdeFrame ideFrame) {
                FlowInsightMetricsAppService.activateIdeFrame(ideFrame);
            }
        }

    }

    public static class IdeActivationListener implements ApplicationActivationListener {

        @Override
        public void applicationActivated(@NotNull IdeFrame ideFrame) {
            FlowInsightMetricsAppService.activateApplication(ideFrame);
        }

        @Override
        public void applicationDeactivated(@NotNull IdeFrame ideFrame) {
            FlowInsightMetricsAppService.deactivateApplication(ideFrame);
        }

    }

}
