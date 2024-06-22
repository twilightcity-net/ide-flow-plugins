package net.twilightcity.flow.intellij.extension;

import net.twilightcity.flow.action.Action;
import net.twilightcity.flow.action.ActionDispatcher;
import net.twilightcity.flow.action.type.ActionType;
import net.twilightcity.flow.action.type.RunAction;
import net.twilightcity.flow.intellij.Logger;

public class FervieActionDispatcher implements ActionDispatcher {
	private final Logger log;
	private final FervieExtensionPointService fervieExtensionPointService;

	public FervieActionDispatcher(Logger log, FervieExtensionPointService fervieExtensionPointService) {
		this.log = log;
		this.fervieExtensionPointService = fervieExtensionPointService;
	}

	@Override
	public void dispatchAction(Action action) {
		if (action.getActionType().equals(ActionType.RUN)) {
			RunAction runAction = (RunAction) action;
			log.debug("run action: "+runAction.getActionId());
			this.fervieExtensionPointService.fireAction(runAction.getActionId());
		}
	}
}
