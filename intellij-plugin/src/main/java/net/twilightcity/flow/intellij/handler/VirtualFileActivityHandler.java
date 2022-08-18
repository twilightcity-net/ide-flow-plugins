package net.twilightcity.flow.intellij.handler;

import com.intellij.openapi.module.Module;
import com.intellij.openapi.module.ModuleUtil;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.ui.DialogWrapper;
import com.intellij.openapi.ui.Messages;
import com.intellij.openapi.ui.popup.JBPopupFactory;
import com.intellij.openapi.vfs.VirtualFile;
import net.twilightcity.flow.activity.ActivityHandler;
import net.twilightcity.flow.activity.ModuleManager;
import org.jetbrains.annotations.NotNull;

import javax.annotation.Nullable;
import javax.swing.*;
import java.awt.*;

public class VirtualFileActivityHandler {

    private final ActivityHandler activityHandler;
    private final ModuleManager moduleManager;

    private static final int YES_RESPONSE = 0;
    private static final int NO_RESPONSE = 1;
    private static final String DEFAULT_MODULE = "default";

    private boolean isModuleAccessBeingValidated = false;

    public VirtualFileActivityHandler(ActivityHandler activityHandler, ModuleManager moduleManager) {
        this.activityHandler = activityHandler;
        this.moduleManager = moduleManager;
    }

    public void startFileEvent(Project project, VirtualFile file) {
        String filePath = getFilePath(project, file);
        String moduleName = getModuleName(project, file);
        requestModuleAccess(moduleName, project, file);
        activityHandler.startFileEvent(moduleName, filePath);
    }

    private void requestModuleAccess(String moduleName, Project project, VirtualFile file) {
        if (isModuleAccessBeingValidated || moduleManager.isModuleKnown(moduleName) || moduleIsDefaultName(moduleName)) {
            return;
        }

        isModuleAccessBeingValidated = true;
        int response = Messages.showYesNoDialog("Would you like to record activity for module '"+moduleName+"'?",
                "FlowInsight Metrics", "Yes", "No", Messages.getQuestionIcon());

        if (response == YES_RESPONSE) {
            String moduleRootDir = getModuleRoot(project, file);
            moduleManager.enableModule(moduleName, moduleRootDir);
        } else if (response == NO_RESPONSE) {
            moduleManager.disableModule(moduleName);
        }

        isModuleAccessBeingValidated = false;

    }

    private boolean moduleIsDefaultName(String moduleName) {
        return moduleName.equals(DEFAULT_MODULE);
    }

    public void endFileEvent(Project project, VirtualFile file) {
        String filePath = getFilePath(project, file);
        activityHandler.endFileEvent(filePath);
    }

    public void fileModified(Project project, VirtualFile file) {
        String filePath = getFilePath(project, file);
        activityHandler.fileModified(filePath);
    }

    private String getFilePath(Project project, VirtualFile file) {
        if (file == null) {
            return null;
        }

        String filePath = file.getName();
        if (project != null) {
            filePath = getFullFilePathOrDefault(file, project, file.getName());
        }
        return filePath;
    }



    public static String getModuleName(Project project, VirtualFile file) {
        Module module = null;
        try {
            module = ModuleUtil.findModuleForFile(file, project);
        } catch (Exception | AssertionError ex) {
            // ignore any issue resolving full file path and just default to file name
        }
        if (module != null) {
            return module.getName();
        } else {
            return DEFAULT_MODULE;
        }
    }

    public static String getModuleRoot(Project project, VirtualFile file) {
        Module module = null;
        try {
            module = ModuleUtil.findModuleForFile(file, project);
        } catch (Exception | AssertionError ex) {
            // ignore any issue resolving full file path and just default to file name
            return null;
        }

        if (module != null) {
            VirtualFile moduleFile = module.getModuleFile();
            if (moduleFile != null) {
                String moduleBasePath = moduleFile.getParent().getPath();
                if (moduleBasePath.endsWith("/.idea")) {
                    moduleBasePath = moduleBasePath.substring(0, moduleBasePath.indexOf("/.idea"));
                }
                if (file.getPath().startsWith(moduleBasePath)) {
                    return moduleBasePath;
                }
            }
        } else {
            String projectBasePath = project.getBasePath();
            if (projectBasePath != null && file.getPath().startsWith(projectBasePath)) {
                return projectBasePath;
            }
        }
        return null;
    }

    public static String getFullFilePathOrDefault(VirtualFile file, Project project, String defaultFilePath) {
        Module module;
        try {
            module = ModuleUtil.findModuleForFile(file, project);
        } catch (Exception | AssertionError ex) {
            // ignore any issue resolving full file path and just default to file name
            return defaultFilePath;
        }

        if (module != null) {
            VirtualFile moduleFile = module.getModuleFile();
            if (moduleFile != null) {
                String moduleBasePath = moduleFile.getParent().getPath();
                if (moduleBasePath.endsWith("/.idea")) {
                    moduleBasePath = moduleBasePath.substring(0, moduleBasePath.indexOf("/.idea"));
                }
                if (file.getPath().startsWith(moduleBasePath)) {
                    return file.getPath().substring(moduleBasePath.length());
                }
            }
        } else {
            String projectBasePath = project.getBasePath();
            if (projectBasePath != null && file.getPath().startsWith(projectBasePath)) {
                return file.getPath().substring(projectBasePath.length());
            }
        }
        return defaultFilePath;
    }

}
