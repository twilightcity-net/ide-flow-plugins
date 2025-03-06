import * as vscode from 'vscode';
import { ActivityHandler } from './activity/ActivityHandler';
import { MessageQueue } from './activity/MessageQueue';
import { TimeService } from './time/TimeService';
import { ModuleManager } from './config/ModuleManager';
import { FlowPublisher } from './activity/FlowPublisher';
import { Logger } from './Logger';
import { TestExecutionTracker } from './debug/TestExecutionTracker';
import { ActionDispatcher } from './action/ActionDispatcher';
import * as path from 'path';
import * as os from 'os';
import { FervieExtensionPointManager } from './action/FervieExtensionPointManager';
import { LastLocationTracker } from './action/LastLocationTracker';
import { ActionFileReader } from './action/ActionFileReader';

export function activate(context: vscode.ExtensionContext) {
    // Create base flow directory
    const flowDir = path.join(os.homedir(), '.flow');
    const pluginDir = path.join(flowDir, 'plugins', 'com.microsoft.vscode');
    
    // Initialize core services
    const logger = new Logger();
    const timeService = new TimeService();
    const moduleManager = new ModuleManager();
    
    // Initialize activity tracking
    const messageQueue = new MessageQueue(timeService, moduleManager, path.join(pluginDir, 'active.flow'));
    const activityHandler = new ActivityHandler(messageQueue, timeService);
    const testExecutionTracker = new TestExecutionTracker(activityHandler);
    const flowPublisher = new FlowPublisher(pluginDir, logger, timeService);

    // Initialize extension point system
    const extensionPointManager = new FervieExtensionPointManager(context, logger);

    // Initialize action dispatcher
    const actionDispatcher = new ActionDispatcher(logger);
    const locationTracker = new LastLocationTracker();
    const actionFileReader = new ActionFileReader(logger);

    // Register event handlers
    let activeEditor = vscode.window.activeTextEditor;
    
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) {
                const filePath = editor.document.uri.fsPath;
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
                const moduleName = workspaceFolder ? workspaceFolder.name : undefined;
                locationTracker.updateLocation(filePath, moduleName);
                activityHandler.startFileEvent(moduleName, filePath);
            } else {
                locationTracker.clear();
                activityHandler.endFileEvent(null);
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            activityHandler.fileModified(event.document.uri.fsPath);
        })
    );

    // Start activity monitoring
    setInterval(() => {
        activityHandler.pushModificationActivity(30);
    }, 30000);

    // Handle window state changes
    vscode.window.onDidChangeWindowState(e => {
        if (!e.focused) {
            const startTime = new Date();
            const disposable = vscode.window.onDidChangeWindowState(e2 => {
                if (e2.focused) {
                    const duration = new Date().getTime() - startTime.getTime();
                    activityHandler.markExternalActivity(duration / 1000, "Editor Deactivated");
                    disposable.dispose();
                }
            });
        }
    });
}

export function deactivate() {
    // Cleanup
} 