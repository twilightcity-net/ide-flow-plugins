package net.twilightcity.flow.action;

import net.twilightcity.flow.action.data.FlowInsightActionContext;
import net.twilightcity.flow.action.type.ActionType;

public interface Action {

	ActionType getActionType();
	FlowInsightActionContext getFlowInsightActionContext();

}
