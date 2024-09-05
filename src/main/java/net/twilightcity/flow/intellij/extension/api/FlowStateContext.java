package net.twilightcity.flow.intellij.extension.api;

import java.util.List;

public interface FlowStateContext {

	FlowStateType getCurrentFlowState();
	Integer getCurrentMomentum();
	List<FileActivity> getMostRecentFileActivity();
}
