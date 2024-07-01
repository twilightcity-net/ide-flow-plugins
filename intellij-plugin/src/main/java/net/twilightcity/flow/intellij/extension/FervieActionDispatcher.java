package net.twilightcity.flow.intellij.extension;

import net.twilightcity.flow.action.Action;
import net.twilightcity.flow.action.ActionDispatcher;
import net.twilightcity.flow.action.type.ActionType;
import net.twilightcity.flow.action.type.GotoAction;
import net.twilightcity.flow.action.type.RunAction;
import net.twilightcity.flow.intellij.Logger;
import net.twilightcity.flow.intellij.handler.GotoFileActionHandler;
import net.twilightcity.flow.intellij.handler.ProjectContextHandler;

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
			log.debug("run action: "+runAction.getActionId());
			this.fervieExtensionPointService.fireAction(projectContextHandler.getProjectContext(), runAction.getActionId());
		} else if (action.getActionType().equals(ActionType.GOTO)) {
			GotoAction gotoAction = (GotoAction) action;
			System.out.println("Goto action: "+gotoAction.getFilePath());
			this.gotoFileActionHandler.fireAction(projectContextHandler.getProjectContext(), gotoAction.getModule(), gotoAction.getFilePath());
		}
	}
}
