package net.twilightcity.flow.intellij.handler;

import com.intellij.openapi.module.Module;
import com.intellij.openapi.module.ModuleUtil;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.vfs.VirtualFile;
import net.twilightcity.flow.activity.ActivityHandler;

public class VirtualFileActivityHandler {

    private final ActivityHandler activityHandler;

    public VirtualFileActivityHandler(ActivityHandler activityHandler) {
        this.activityHandler = activityHandler;
    }

    public void startFileEvent(Project project, VirtualFile file) {
        String filePath = getFilePath(project, file);
        String moduleName = getModuleName(project, file);
        activityHandler.startFileEvent(moduleName, filePath);
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
        Module module;
        try {
            module = ModuleUtil.findModuleForFile(file, project);
        } catch (Exception | AssertionError ex) {
            // ignore any issue resolving full file path and just default to file name
            return "default";
        }
        return module.getName();
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
