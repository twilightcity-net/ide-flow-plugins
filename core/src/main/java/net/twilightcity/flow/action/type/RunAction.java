package net.twilightcity.flow.action.type;

import net.twilightcity.flow.action.Action;

import java.time.LocalDateTime;

public class RunAction implements Action {

	private final String actionId;
	private final String extensionName;
	private final LocalDateTime position;

	public RunAction(String actionId, String extensionName, LocalDateTime position) {
		this.actionId = actionId;
		this.extensionName = extensionName;
		this.position = position;
	}

	@Override
	public ActionType getActionType() {
		return ActionType.RUN;
	}

	public String getActionId() {
		return actionId;
	}

	public String getExtensionName() {
		return extensionName;
	}

	public LocalDateTime getPosition() {
		return position;
	}
}
