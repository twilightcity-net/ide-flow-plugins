package net.twilightcity.flow.intellij.extension;

import com.intellij.openapi.extensions.ExtensionPointName;
import com.intellij.openapi.project.Project;
import net.twilightcity.flow.config.FervieActionConfigManager;
import net.twilightcity.flow.intellij.Logger;
import net.twilightcity.flow.intellij.extension.api.FerviePopupByHotKeyAction;
import net.twilightcity.flow.intellij.extension.api.FileActivity;
import net.twilightcity.flow.intellij.extension.api.FlowStateContext;

import java.util.HashMap;
import java.util.Map;

public final class FervieExtensionPointService {

	private final FervieActionConfigManager fervieActionManager;
	private Map<String, FerviePopupByHotKeyAction> actionMap;

	private static final Logger log = Logger.INSTANCE;

	private static final ExtensionPointName<FerviePopupByHotKeyAction> EP_NAME =
			ExtensionPointName.create("net.twilightcity.flow.ferviePopupByHotkey");

	public FervieExtensionPointService(FervieActionConfigManager fervieActionManager) {
		this.fervieActionManager = fervieActionManager;
	}

	public void initRegisteredExtensions() {
		actionMap = new HashMap<>();
		String extensionName = EP_NAME.getName();

		for (FerviePopupByHotKeyAction extension : EP_NAME.getExtensions()) {
			String actionId = extension.getActionId();
			String buttonText = extension.getFervieButtonText();
			String buttonTip = extension.getFervieButtonTooltip();

			fervieActionManager.addFervieAction(extensionName, actionId, buttonText, buttonTip);
			log.info("[FervieExtensionPointService] Registered Extension: "+actionId + " with button: "+buttonText);
			actionMap.put(actionId, extension);
		}

		//temporary code for testing before we have registered extension points in here
//		FerviePopupByHotKeyAction helloAction = new HelloAction();
//		fervieActionManager.addFervieAction(extensionName, helloAction.getActionId(), helloAction.getFervieButtonText(), helloAction.getFervieButtonTooltip());
//		actionMap.put(helloAction.getActionId(), helloAction);

		fervieActionManager.flushToJson();
	}


	public void fireAction(Project projectContext, String actionId, FlowStateContext flowStateContext) {
		log.debug("fire action: "+actionId);
		FerviePopupByHotKeyAction action = actionMap.get(actionId);
		if (action != null) {
			action.onFervieAction(flowStateContext);
		} else {
			log.warn("[FervieExtensionPointService] Action not found for id = "+actionId);
		}
	}

	private class HelloAction implements FerviePopupByHotKeyAction{

		@Override
		public String getActionId() {
			return "hello.action";
		}

		@Override
		public String getFervieButtonText() {
			return "Hello World!";
		}

		@Override
		public String getFervieButtonTooltip() {
			return "Hello world tip";
		}

		@Override
		public void onFervieAction(FlowStateContext context) {

			System.out.println("Fervie: \"Hello!\" action callback");
			System.out.println("context: momentum = "+context.getCurrentMomentum());
			System.out.println("context: flow state = "+context.getCurrentFlowState());
			System.out.println("file activity size = "+ context.getMostRecentFileActivity().size());
			for (FileActivity file : context.getMostRecentFileActivity()) {
				System.out.println(file.getModule() + "::"+ file.getFilePath() + ":: " + file.getDurationInSeconds());
			}
		}
	}

}
