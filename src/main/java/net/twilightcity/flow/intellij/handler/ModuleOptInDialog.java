package net.twilightcity.flow.intellij.handler;

import com.intellij.openapi.ui.DialogWrapper;
import com.intellij.util.ui.JBUI;
import org.jetbrains.annotations.NotNull;

import javax.annotation.Nullable;
import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;

public class ModuleOptInDialog extends DialogWrapper {

	public static int YES_RESPONSE = 0;
	public static int NO_RESPONSE = -1;
	public static int YES_TO_ALL_RESPONSE = 1;

	private final String moduleName;

	public ModuleOptInDialog(String moduleName) {
		super(true); // use current window as parent
		this.moduleName = moduleName;
		setTitle("FlowInsight Metrics");
		init();

	}

	@Nullable
	@Override
	protected JComponent createCenterPanel() {
		JPanel dialogPanel = new JPanel(new BorderLayout());

		JLabel label = new JLabel("<html><p>Would you like to record activity for module '"+moduleName+"'?</p></html>");
		label.setPreferredSize(new Dimension(400, 50));
		label.setBorder(JBUI.Borders.empty(0, 10));
		dialogPanel.add(label, BorderLayout.CENTER);

		return dialogPanel;
	}

	@NotNull
	@Override
	protected Action[] createActions() {
		Action [] actions = new Action[3];
		actions[0] = new YesAction();
		actions[1] = new YesToAllAction();
		actions[2] = new NoAction();
		return actions;
	}

	private class YesAction extends DialogWrapperExitAction {
		public YesAction() {
			super("Yes", YES_RESPONSE);
		}
	}

	private class YesToAllAction extends DialogWrapperExitAction {
		public YesToAllAction() {
			super("Yes to All", YES_TO_ALL_RESPONSE);
		}
	}

	private class NoAction extends DialogWrapperExitAction {
		public NoAction() {
			super("No", NO_RESPONSE);
		}
	}
}
