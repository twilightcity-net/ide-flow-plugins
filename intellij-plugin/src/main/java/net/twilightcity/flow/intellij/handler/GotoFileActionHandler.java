package net.twilightcity.flow.intellij.handler;

import com.intellij.openapi.fileEditor.FileEditorManager;
import com.intellij.openapi.fileTypes.FileType;
import com.intellij.openapi.fileTypes.FileTypeManager;
import com.intellij.openapi.module.Module;
import com.intellij.openapi.module.ModuleManager;
import com.intellij.openapi.module.ModuleUtil;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.project.ProjectManager;
import com.intellij.openapi.vfs.VirtualFile;
import com.intellij.psi.search.FileTypeIndex;
import com.intellij.psi.search.FilenameIndex;
import com.intellij.psi.search.GlobalSearchScope;
import com.intellij.util.indexing.FileBasedIndex;
import net.twilightcity.flow.intellij.Logger;
import org.jetbrains.annotations.NotNull;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

public class GotoFileActionHandler {

	private final Logger log;

	public GotoFileActionHandler(Logger logger) {
		this.log = logger;

	}
	public void fireAction(Project activeProjectContext, String moduleName, String filePath) {
		log.debug("[GotoFileActionHandler] fireAction goto file: "+filePath);
		//TODO maybe what I can do with this is construct the full path from finding a matching module
		// I can walk the set of open projects and look for a matching module with any of them

		if (activeProjectContext != null) {

			boolean isModuleFound = activeProjectContext.getName().equals(moduleName);

			if (!isModuleFound) {
				Module[] modulesInProject = ModuleManager.getInstance(activeProjectContext).getModules();
				for (Module projectModule : modulesInProject) {
					log.debug("module in project = "+projectModule);
					if (projectModule.getName().equals(moduleName)) {
						isModuleFound = true;
						break;
					}
				}
			}

//			if (isModuleFound) {
//				List<VirtualFile> virtualFiles = findFileByRelativePath(activeProjectContext, filePath);
//				if (virtualFiles.size() > 0) {
//					FileEditorManager.getInstance(activeProjectContext).openFile(virtualFiles.get(0), true, true);
//				} else {
//					log.debug("[GotoFileActionHandler] matching file not found");
//				}
//			} else {
//				log.debug("[GotoFileActionHandler] Matching module not found");
//			}

		} else {
			log.debug("Goto run without an active project");
		}


//		Project[] projects = ProjectManager.getInstance().getOpenProjects();
//		for (Project project : projects) {
//			System.out.println("project = "+project.getName());
//		}
//

	}

	//navigate to a particular file in the IDE
}
