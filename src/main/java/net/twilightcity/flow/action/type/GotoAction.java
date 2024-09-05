package net.twilightcity.flow.action.type;

import net.twilightcity.flow.action.Action;
import net.twilightcity.flow.action.data.FlowInsightActionContext;

import java.time.LocalDateTime;

public class GotoAction implements Action {

	private final String module;
	private final String filePath;
	private final LocalDateTime position;
	private final FlowInsightActionContext flowInsightContext;

	public GotoAction(String module, String filePath, LocalDateTime position, FlowInsightActionContext flowInsightContext) {
		this.module = module;
		this.filePath = filePath;
		this.position = position;
		this.flowInsightContext = flowInsightContext;
	}

	@Override
	public ActionType getActionType() {
		return ActionType.GOTO;
	}

	@Override
	public FlowInsightActionContext getFlowInsightActionContext() {
		return flowInsightContext;
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
