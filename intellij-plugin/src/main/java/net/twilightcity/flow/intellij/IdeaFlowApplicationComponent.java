package net.twilightcity.flow.intellij;

import com.intellij.openapi.application.ApplicationActivationListener;
import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.components.ApplicationComponent;
import com.intellij.openapi.fileEditor.FileEditorManager;
import com.intellij.openapi.ui.Messages;
import com.intellij.openapi.util.IconLoader;
import com.intellij.openapi.vfs.VirtualFile;
import com.intellij.openapi.wm.IdeFrame;
import com.intellij.ui.UIBundle;
import com.intellij.util.messages.MessageBusConnection;
import net.twilightcity.flow.controller.IFMController;
import net.twilightcity.flow.intellij.handler.DeactivationHandler;
import net.twilightcity.flow.intellij.handler.VirtualFileActivityHandler;

import javax.swing.*;
import java.awt.*;
import java.beans.PropertyChangeEvent;
import java.beans.PropertyChangeListener;

public class IdeaFlowApplicationComponent extends ApplicationComponent.Adapter {

    public static final Logger log = Logger.INSTANCE;

    private static final String NAME = "IdeaFlow.Component";

    private static final String FOCUSED_WINDOW_EVENT = "focusedWindow";

    private IFMController controller;
    private MessageBusConnection appConnection;
    private VirtualFileActivityHandler virtualFileActivityHandler;

    public static IdeaFlowApplicationComponent getApplicationComponent() {
        return (IdeaFlowApplicationComponent) ApplicationManager.getApplication().getComponent(NAME);
    }

    public static IFMController getIFMController() {
        return getApplicationComponent().controller;
    }

    public static VirtualFileActivityHandler getFileActivityHandler() {
        return getApplicationComponent().virtualFileActivityHandler;
    }

    public static Icon getIcon(String path) {
        return IconLoader.getIcon("/icons/" + path, IdeaFlowApplicationComponent.class);
    }

    public static String promptForInput(String title, String message) {
        return Messages.showInputDialog(message, UIBundle.message(title), Messages.getQuestionIcon());
    }

    public static void showErrorMessage(String title, String message) {
        Messages.showErrorDialog(message, title);
    }

    @Override
    public String getComponentName() {
        return NAME;
    }

    @Override
    public void initComponent() {
        controller = new IFMController(log);
        virtualFileActivityHandler = new VirtualFileActivityHandler(controller.getActivityHandler(),
                controller.getModuleManager(), controller.getLastLocationTracker());

        try {
            controller.start();
        } catch (Exception ex) {
            // TODO: this should be a message popup to the user
            log.error("Disabling FlowInsight Metrics Plugin due to controller initialization failure: " + ex.getMessage(), ex.getCause());
        }

        IDEApplicationListener applicationListener = new IDEApplicationListener(controller, virtualFileActivityHandler);
        appConnection = ApplicationManager.getApplication().getMessageBus().connect();
        appConnection.subscribe(ApplicationActivationListener.TOPIC, applicationListener);

        KeyboardFocusManager.getCurrentKeyboardFocusManager().addPropertyChangeListener(
                FOCUSED_WINDOW_EVENT,
                new FocusChangeEventListener(virtualFileActivityHandler)
        );

    }

    @Override
    public void disposeComponent() {
        if (controller != null) {
            controller.shutdown();
        }
        if (appConnection != null) {
            appConnection.disconnect();
        }
    }

    private static class FocusChangeEventListener implements PropertyChangeListener {

        private final VirtualFileActivityHandler virtualFileActivityHandler;

        FocusChangeEventListener(VirtualFileActivityHandler virtualFileActivityHandler) {
            this.virtualFileActivityHandler = virtualFileActivityHandler;
        }

        @Override
        public void propertyChange(PropertyChangeEvent evt) {
            if (evt.getNewValue() instanceof IdeFrame) {
                IdeFrame ideFrame = (IdeFrame) evt.getNewValue();
                if (ideFrame.getProject() != null) { //project window selected

                    FileEditorManager editorManager = FileEditorManager.getInstance(ideFrame.getProject());
                    if (editorManager != null) {
                        VirtualFile[] selectedFiles = editorManager.getSelectedFiles();
                        if (selectedFiles.length > 0) {
                            virtualFileActivityHandler.startFileEvent(ideFrame.getProject(), selectedFiles[0]);
                        }
                    }
                }
            }
        }
    }

    private static class IDEApplicationListener implements ApplicationActivationListener {

        private final VirtualFileActivityHandler virtualFileActivityHandler;
        private DeactivationHandler deactivationHandler;

        IDEApplicationListener(IFMController controller, VirtualFileActivityHandler virtualFileActivityHandler) {
            deactivationHandler = new DeactivationHandler(controller);
            this.virtualFileActivityHandler = virtualFileActivityHandler;
        }

        @Override
        public void applicationActivated(IdeFrame ideFrame) {
            if (ideFrame.getProject() != null) {
                deactivationHandler.activated();

                FileEditorManager editorManager = FileEditorManager.getInstance(ideFrame.getProject());
                if (editorManager != null) {
                    VirtualFile[] selectedFiles = editorManager.getSelectedFiles();
                    if (selectedFiles.length > 0) {
                        virtualFileActivityHandler.startFileEvent(ideFrame.getProject(), selectedFiles[0]);
                    }
                }
            }
        }

        @Override
        public void applicationDeactivated(IdeFrame ideFrame) {
            if (ideFrame.getProject() != null) {
                deactivationHandler.deactivated();

                FileEditorManager editorManager = FileEditorManager.getInstance(ideFrame.getProject());
                if (editorManager != null) {
                    VirtualFile[] selectedFiles = editorManager.getSelectedFiles();
                    if (selectedFiles.length > 0) {
                        virtualFileActivityHandler.endFileEvent(ideFrame.getProject(), selectedFiles[0]);
                    }
                }
            }
        }

    }

}
