package net.twilightcity.flow.action.data;

import java.util.List;

public class FlowInsightActionContext {
	private String currentFlowState;
	private Integer currentMomentum;
	private List<FileActivityActionContext> mostRecentFileActivity;

	public String getCurrentFlowState() {
		return currentFlowState;
	}

	public Integer getCurrentMomentum() {
		return currentMomentum;
	}

	public List<FileActivityActionContext> getMostRecentFileActivity() {
		return mostRecentFileActivity;
	}

	public void setCurrentFlowState(String currentFlowState) {
		this.currentFlowState = currentFlowState;
	}

	public void setCurrentMomentum(Integer currentMomentum) {
		this.currentMomentum = currentMomentum;
	}

	public void setMostRecentFileActivity(List<FileActivityActionContext> mostRecentFileActivity) {
		this.mostRecentFileActivity = mostRecentFileActivity;
	}
}
