package net.twilightcity.flow.intellij.extension.api;

public interface FlowStateContext {

	//could potentially pass data here?  What would we want?

	String getCurrentFlowState();
	Integer getCurrentMomentum();
	String getMostRecentCodeArea();

}
