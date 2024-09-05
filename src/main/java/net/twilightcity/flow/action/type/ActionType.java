package net.twilightcity.flow.action.type;

public enum ActionType {
	RUN,
	GOTO;

	public static boolean isValid(String actionTypeStr) {
		return actionTypeStr.equals("RUN") || actionTypeStr.equals("GOTO");
	}
}
