package net.twilightcity.flow.intellij.extension.api;

public interface FerviePopupByHotKeyAction {

	String getActionId();

	String getFervieButtonText();

	String getFervieButtonTooltip();

	void onFervieAction(FlowStateContext flowStateContext);
}
