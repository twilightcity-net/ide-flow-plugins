package net.twilightcity.flow.intellij.action;

import com.intellij.openapi.actionSystem.AnActionEvent;
import com.intellij.openapi.actionSystem.Presentation;
import com.intellij.openapi.editor.Editor;
import com.intellij.openapi.editor.SelectionModel;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.vfs.VirtualFile;
import net.twilightcity.flow.controller.IFMController;
import net.twilightcity.flow.intellij.handler.VirtualFileActivityHandler;
import net.twilightcity.flow.intellij.IdeaFlowApplicationComponent;

public class ActionSupport {

    public static IFMController getIFMController(AnActionEvent e) {
        IFMController controller = null;
        if (e != null && e.getProject() != null) {
            controller = IdeaFlowApplicationComponent.getIFMController();
        }
        return controller;
    }

    public static SelectedSnippet getSelectedText(Editor editor) {
        if (editor == null) {
            return null;
        }

        SelectionModel selectionModel = editor.getSelectionModel();

        SelectedSnippet selectedSnippet = new SelectedSnippet();
        selectedSnippet.setText(selectionModel.getSelectedText());

        if (selectionModel.getSelectionStartPosition() != null) {
            selectedSnippet.setLineNumber(selectionModel.getSelectionStartPosition().getLine());
        }

        return selectedSnippet;
    }

    public static String getActiveFilePath(Project project, VirtualFile file) {
        String fileName = null;

        if (file != null) {
            fileName = VirtualFileActivityHandler.getFullFilePathOrDefault(file, project, file.getName());
        }
        return fileName;
    }

    public static boolean isActive(AnActionEvent e) {
        IFMController controller = getIFMController(e);
        return controller != null && controller.isActive();
    }

    public static void disableWhenNotRecording(AnActionEvent e) {
        Presentation presentation = e.getPresentation();
        presentation.setEnabled(isActive(e));
    }

}
