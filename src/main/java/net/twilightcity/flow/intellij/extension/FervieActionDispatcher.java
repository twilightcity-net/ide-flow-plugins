package net.twilightcity.flow.intellij.extension;

import net.twilightcity.flow.action.Action;
import net.twilightcity.flow.action.ActionDispatcher;
import net.twilightcity.flow.action.data.FileActivityActionContext;
import net.twilightcity.flow.action.data.FlowInsightActionContext;
import net.twilightcity.flow.action.type.ActionType;
import net.twilightcity.flow.action.type.GotoAction;
import net.twilightcity.flow.action.type.RunAction;
import net.twilightcity.flow.intellij.Logger;
import net.twilightcity.flow.intellij.extension.api.FileActivity;
import net.twilightcity.flow.intellij.extension.api.FlowStateContext;
import net.twilightcity.flow.intellij.extension.api.FlowStateType;
import net.twilightcity.flow.intellij.handler.GotoFileActionHandler;
import net.twilightcity.flow.intellij.handler.ProjectContextHandler;

import java.util.ArrayList;
import java.util.List;

public class FervieActionDispatcher implements ActionDispatcher {
	private final Logger log;
	private final FervieExtensionPointService fervieExtensionPointService;
	private final GotoFileActionHandler gotoFileActionHandler;
	private final ProjectContextHandler projectContextHandler;

	public FervieActionDispatcher(Logger log, FervieExtensionPointService fervieExtensionPointService, GotoFileActionHandler gotoFileActionHandler, ProjectContextHandler projectContextHandler) {
		this.log = log;
		this.fervieExtensionPointService = fervieExtensionPointService;
		this.gotoFileActionHandler = gotoFileActionHandler;
		this.projectContextHandler = projectContextHandler;
	}

	@Override
	public void dispatchAction(Action action) {
		if (action.getActionType().equals(ActionType.RUN)) {
			RunAction runAction = (RunAction) action;
			System.out.println("run action: "+runAction.getActionId());
			this.fervieExtensionPointService.fireAction(projectContextHandler.getProjectContext(), runAction.getActionId(), createFlowStateContext(action.getFlowInsightActionContext()));
		} else if (action.getActionType().equals(ActionType.GOTO)) {
			GotoAction gotoAction = (GotoAction) action;
			System.out.println("Goto action: "+gotoAction.getFilePath());
			this.gotoFileActionHandler.fireAction(projectContextHandler.getProjectContext(), gotoAction.getModule(), gotoAction.getFilePath());
		}
	}

	FlowStateContext createFlowStateContext(FlowInsightActionContext flowInsightContext) {
		return new FlowStateContextImpl(flowInsightContext);
	}

	private class FlowStateContextImpl implements FlowStateContext {

		private final FlowInsightActionContext context;

		public FlowStateContextImpl(FlowInsightActionContext context) {
			this.context = context;
		}
		@Override
		public FlowStateType getCurrentFlowState() {
			FlowStateType flowStateType = FlowStateType.FLOW;
			try {
				flowStateType = FlowStateType.valueOf(context.getCurrentFlowState());
			} catch (IllegalArgumentException ex) {
				log.warn("Unable to parse flow state type with value: "+context.getCurrentFlowState());
			}
			return flowStateType;
		}

		@Override
		public Integer getCurrentMomentum() {
			return context.getCurrentMomentum();
		}

		@Override
		public List<FileActivity> getMostRecentFileActivity() {
			List<FileActivity> fileActivityList = new ArrayList<>();
			for (FileActivityActionContext fileActivityContext : context.getMostRecentFileActivity()) {
				fileActivityList.add(new FileActivityImpl(fileActivityContext));
			}
			return fileActivityList;
 		}
	}

	private class FileActivityImpl implements FileActivity {
		private final FileActivityActionContext context;

		FileActivityImpl(FileActivityActionContext context) {
			this.context = context;
		}

		@Override
		public String getModule() {
			return context.getModule();
		}

		@Override
		public String getFilePath() {
			return context.getFilePath();
		}

		@Override
		public Integer getDurationInSeconds() {
			return context.getDuration();
		}
	}
}
