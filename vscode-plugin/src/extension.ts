import * as vscode from 'vscode';
import { ActivityHandler } from './activity/ActivityHandler';
import { MessageQueue } from './activity/MessageQueue';
import { TimeService } from './time/TimeService';
import { ModuleManager } from './config/ModuleManager';
import { FlowPublisher } from './activity/FlowPublisher';
import { Logger } from './Logger';
import { TestExecutionTracker } from './debug/TestExecutionTracker';
import { TaskExecutionHandler } from './handler/TaskExecutionHandler';
import { ActionDispatcher } from './action/ActionDispatcher';
import * as path from 'path';
import * as os from 'os';
import { FervieExtensionPointManager } from './action/FervieExtensionPointManager';
import { LastLocationTracker } from './action/LastLocationTracker';
import { ActionFileReader } from './action/ActionFileReader';
import { FlowController } from './controller/FlowController';
import { FileActivityHandler } from './handler/FileActivityHandler';
import { CreateSnippetCommand } from './commands/CreateSnippetCommand';
import { FlushBatchCommand } from './commands/FlushBatchCommand';

let flowController: FlowController | undefined;

export function activate(context: vscode.ExtensionContext) {
    // Create base flow directory
    const flowDir = path.join(os.homedir(), '.flow');
    const pluginDir = path.join(flowDir, 'plugins', 'com.microsoft.vscode');
    
    // Initialize core services
    const logger = new Logger();
    const timeService = new TimeService();
    const moduleManager = new ModuleManager(pluginDir, logger);
    
    // Initialize activity tracking
    const messageQueue = new MessageQueue(timeService, moduleManager, path.join(pluginDir, 'active.flow'));
    const activityHandler = new ActivityHandler(messageQueue, timeService);
    const flowPublisher = new FlowPublisher(pluginDir, logger, timeService);
    
    // Initialize action system
    const locationTracker = new LastLocationTracker();
    const actionFileReader = new ActionFileReader(logger);
    
    // Initialize extension point system
    const extensionPointManager = new FervieExtensionPointManager(context, logger);
    
    // Initialize action dispatcher with extension point manager
    const actionDispatcher = new ActionDispatcher(logger, extensionPointManager);
    
    // Initialize FlowController
    flowController = new FlowController(
        logger,
        flowPublisher,
        activityHandler,
        messageQueue,
        moduleManager,
        timeService,
        actionDispatcher,
        actionFileReader,
        pluginDir
    );

    // Initialize file activity handler with module opt-in
    const fileActivityHandler = new FileActivityHandler(
        activityHandler,
        moduleManager,
        locationTracker,
        logger
    );

    // Configure action dispatcher in controller (for action file watcher)
    flowController.configureActionDispatcher(actionDispatcher);

    // Initialize process execution trackers
    // TaskExecutionHandler tracks all tasks (builds, scripts, applications)
    const taskExecutionHandler = new TaskExecutionHandler(activityHandler, logger);
    
    // TestExecutionTracker tracks test-specific debug sessions
    const testExecutionTracker = new TestExecutionTracker(activityHandler);

    // Register commands
    const createSnippetCommand = new CreateSnippetCommand(flowController, logger);
    const flushBatchCommand = new FlushBatchCommand(flowController, logger);

    context.subscriptions.push(
        vscode.commands.registerCommand('flowinsight.createSnippet', () => createSnippetCommand.execute()),
        vscode.commands.registerCommand('flowinsight.uploadFlow', () => flushBatchCommand.execute())
    );

    // Register event handlers for file activity
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                const filePath = editor.document.uri.fsPath;
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
                fileActivityHandler.startFileEvent(workspaceFolder, filePath);
            } else {
                fileActivityHandler.endFileEvent(null);
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument(document => {
            fileActivityHandler.endFileEvent(document.uri.fsPath);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            fileActivityHandler.fileModified(event.document.uri.fsPath);
        })
    );

    // Handle window state changes for deactivation tracking
    let deactivatedAt: number | undefined;
    context.subscriptions.push(
        vscode.window.onDidChangeWindowState(e => {
            if (!e.focused) {
                deactivatedAt = Date.now();
            } else if (e.focused && deactivatedAt !== undefined) {
                const duration = Math.round((Date.now() - deactivatedAt) / 1000);
                if (duration >= 60) { // 1 minute threshold
                    activityHandler.markExternalActivity(duration, "Editor Deactivated");
                }
                deactivatedAt = undefined;
            }
        })
    );

    // Start the controller (this will start FlowPublisher and action watcher)
    // Note: This may not fully start if settings.json is missing, but extension will still activate
    flowController.start().catch(error => {
        // Only show error dialog if it's not a missing settings file (which is handled gracefully)
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes('Failed to resolve api settings')) {
            logger.error('Failed to start FlowController', error);
            vscode.window.showErrorMessage('FlowInsight: Failed to initialize. Check logs for details.');
        }
    });

    logger.info('FlowInsight extension activated');
}

export function deactivate() {
    if (flowController) {
        flowController.shutdown();
    }
}
