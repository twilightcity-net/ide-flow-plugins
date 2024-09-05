package net.twilightcity.flow.action.type;

import net.twilightcity.flow.action.Action;
import net.twilightcity.flow.action.data.FlowInsightActionContext;

import java.time.LocalDateTime;

public class RunAction implements Action {

	private final String actionId;
	private final String extensionName;
	private final LocalDateTime position;
	private final FlowInsightActionContext flowInsightContext;

	public RunAction(String actionId, String extensionName, LocalDateTime position, FlowInsightActionContext flowInsightContext) {
		this.actionId = actionId;
		this.extensionName = extensionName;
		this.position = position;
		this.flowInsightContext = flowInsightContext;
	}

	@Override
	public ActionType getActionType() {
		return ActionType.RUN;
	}

	@Override
	public FlowInsightActionContext getFlowInsightActionContext() {
		return flowInsightContext;
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
