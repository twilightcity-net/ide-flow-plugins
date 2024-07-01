package net.twilightcity.flow.intellij.handler;

import com.intellij.openapi.project.Project;

public class ProjectContextHandler {

	private Project projectContext;

	public void updateContext(Project project) {
		if (project != null) {
			this.projectContext = project;
		}
	}

	public Project getProjectContext() {
		return projectContext;
	}
}
