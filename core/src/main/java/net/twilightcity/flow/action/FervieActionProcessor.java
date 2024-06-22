package net.twilightcity.flow.action;

import net.twilightcity.flow.Logger;

import java.io.File;
import java.util.List;

public class FervieActionProcessor {
	private final Logger log;
	private final File fervieActionsDirectory;
	private final File fervieActionFile;
	private final ActionFileReader actionFileReader;

	private ActionDispatcher actionDispatcher;

	private boolean isRunning;
	private Thread watchThread;

	public FervieActionProcessor(Logger logger, File fervieActionsDirectory, File fervieActionFile) {
		this.log = logger;
		this.fervieActionsDirectory = fervieActionsDirectory;
		this.fervieActionFile = fervieActionFile;
		this.actionFileReader = new ActionFileReader(logger);
	}


	public void exitWatchLoop() {
		this.isRunning = false;
		if (watchThread != null) {
			watchThread.interrupt();
		}
	}

	public void startWatchLoop() {;
		this.isRunning = true;
		if (this.watchThread != null) {
			this.watchThread.interrupt();
			this.watchThread = null;
		}

		this.watchThread = new Thread(this::watchLoop);
		log.debug("Starting watch thread...");
		watchThread.start();
	}

	/**
	 * Note this uses file-polling to detect when the file is modified, once per second.
	 * Tried to use the WatchService, but apparently there isn't native support for MacOS,
	 * and so it's suuuuuper slow.  This at least works.
	 */
	private void watchLoop() {
		try {
			log.debug("Running the loop thread...");

			long lastModified = 0L;
			// Infinite loop to continuously watch for events
			while (isRunning) {

				if (fervieActionFile.exists()) {
					long modifyTime = fervieActionFile.lastModified();

					if (lastModified != modifyTime ) {
						lastModified = modifyTime;

						log.debug("file changed = "+modifyTime);
						handleFileChangeEvent(modifyTime);
					}
				}

				Thread.sleep(1000);
			}
		} catch (InterruptedException e) {
			//this happens in normal conditions on shutdown
		}
	}

	private void handleFileChangeEvent(long modifyTime) {
		String tempFileName = modifyTime + ".action";
		File tempFile = new File(fervieActionsDirectory, tempFileName);
		boolean success = fervieActionFile.renameTo(tempFile);

		if (success) {
			List<Action> actions = actionFileReader.readActionsFromFile(tempFile);
			log.debug("Dispatching "+actions.size() + " actions");

			dispatchActions(actions);

		} else {
			log.warn("Unable to rename file "+fervieActionFile + " to "+tempFileName);
		}
	}

	private void dispatchActions(List<Action> actions) {
		if (actionDispatcher != null) {
			for (Action action : actions) {
				actionDispatcher.dispatchAction(action);
			}
		} else {
			log.warn("Skipping action processing, actionDispatcher not configured");
		}
	}

	public void configureActionDispatcher(ActionDispatcher actionDispatcher) {
		this.actionDispatcher = actionDispatcher;
	}
}
