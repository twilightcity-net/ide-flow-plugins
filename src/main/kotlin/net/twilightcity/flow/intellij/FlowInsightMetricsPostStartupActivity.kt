package net.twilightcity.flow.intellij;

import com.intellij.openapi.project.DumbAware
import com.intellij.openapi.project.Project
import com.intellij.openapi.startup.ProjectActivity

internal class ProjectOpenStartupActivity : ProjectActivity, DumbAware {

    override suspend fun execute(project: Project) {
        FlowInsightMetricsProjectService.getInstance(project).onProjectOpen()
    }

}