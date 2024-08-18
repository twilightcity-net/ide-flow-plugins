package net.twilightcity.flow.action;

import net.twilightcity.flow.Logger;
import net.twilightcity.flow.action.data.FlowInsightActionContext;
import net.twilightcity.flow.action.type.ActionType;
import net.twilightcity.flow.action.type.GotoAction;
import net.twilightcity.flow.action.type.RunAction;
import net.twilightcity.flow.activity.JSONConverter;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ActionFileReader {

	private final Logger log;

	private final JSONConverter jsonConverter = new JSONConverter();

	public ActionFileReader(Logger logger) {
		this.log = logger;
	}

	List<Action> readActionsFromFile(File actionsFileSnapshot) {
		if (!actionsFileSnapshot.exists()) {
			log.warn("Unable to read actions, file does not exist: "+actionsFileSnapshot);
			return Collections.emptyList();
		}

		try (BufferedReader br = new BufferedReader(new FileReader(actionsFileSnapshot)))
		{
			String sCurrentLine;
			List<Action> actions = new ArrayList<>();
			while ((sCurrentLine = br.readLine()) != null)
			{
				Action action = createActionFromLine(sCurrentLine);
				if (action != null) {
					actions.add(action);
				}
			}
			return actions;
		}

		catch (IOException e)
		{
			log.error("Unable to read actions file", e);
		}
		return Collections.emptyList();
	}

	private Action createActionFromLine(String currentLine) throws IOException {

		System.out.println("Reading action: "+currentLine);
		int indexOfSplit = currentLine.indexOf('=');

		String actionTypeStr = currentLine.substring(0, indexOfSplit);
		String jsonStr = currentLine.substring(indexOfSplit + 1);

		ActionType actionType = toActionType(actionTypeStr);

		if (actionType != null) {
			if (actionType.equals(ActionType.RUN)) {
				return createRunActionFromJson(jsonStr);
			} else if (actionType.equals(ActionType.GOTO)) {
				return createGotoActionFromJson(jsonStr);
			}
		}

		return null;
	}

	private Action createGotoActionFromJson(String jsonStr) throws IOException {
		GotoActionProps props = jsonConverter.fromPlainJSON(jsonStr, GotoActionProps.class);
		return new GotoAction(props.module, props.filePath, props.position, null);
	}

	private Action createRunActionFromJson(String jsonStr) throws IOException {
		RunActionProps props = jsonConverter.fromPlainJSON(jsonStr, RunActionProps.class);
		return new RunAction(props.actionId, props.extensionName, props.position, props.flowInsightActionContext );
	}

	private ActionType toActionType(String actionTypeStr) {
		if (ActionType.isValid(actionTypeStr)) {
			return ActionType.valueOf(actionTypeStr);
		} else {
			log.warn("Invalid Action type "+actionTypeStr);
			return null;
		}
	}

	private static class RunActionProps {
		private String actionId;
		private String extensionName;
		private LocalDateTime position;
		private FlowInsightActionContext flowInsightActionContext;

		public String getActionId() {
			return actionId;
		}

		public void setActionId(String actionId) {
			this.actionId = actionId;
		}

		public String getExtensionName() {
			return extensionName;
		}

		public void setExtensionName(String extensionName) {
			this.extensionName = extensionName;
		}

		public LocalDateTime getPosition() {
			return position;
		}

		public void setPosition(LocalDateTime position) {
			this.position = position;
		}

		public FlowInsightActionContext getFlowInsightActionContext() {
			return flowInsightActionContext;
		}

		public void setFlowInsightActionContext(FlowInsightActionContext flowInsightActionContext) {
			this.flowInsightActionContext = flowInsightActionContext;
		}
	}

	private static class GotoActionProps {
		private String module;
		private String filePath;
		private LocalDateTime position;

		public String getModule() {
			return module;
		}

		public void setModule(String module) {
			this.module = module;
		}

		public String getFilePath() {
			return filePath;
		}

		public void setFilePath(String filePath) {
			this.filePath = filePath;
		}

		public LocalDateTime getPosition() {
			return position;
		}

		public void setPosition(LocalDateTime position) {
			this.position = position;
		}
	}
}
