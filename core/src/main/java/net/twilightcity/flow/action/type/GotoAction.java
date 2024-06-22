package net.twilightcity.flow.action.type;

import net.twilightcity.flow.action.Action;

import java.time.LocalDateTime;

public class GotoAction implements Action {

	private final String module;
	private final String filePath;
	private final LocalDateTime position;

	public GotoAction(String module, String filePath, LocalDateTime position) {
		this.module = module;
		this.filePath = filePath;
		this.position = position;
	}

	@Override
	public ActionType getActionType() {
		return ActionType.GOTO;
	}

	public String getModule() {
		return module;
	}

	public String getFilePath() {
		return filePath;
	}

	public LocalDateTime getPosition() {
		return position;
	}
}
