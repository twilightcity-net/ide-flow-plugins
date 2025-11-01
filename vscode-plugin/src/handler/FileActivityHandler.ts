import * as vscode from 'vscode';
import * as path from 'path';
import { ActivityHandler } from '../activity/ActivityHandler';
import { ModuleManager } from '../config/ModuleManager';
import { LastLocationTracker } from '../action/LastLocationTracker';
import { ModuleOptInDialog } from '../config/ModuleOptInDialog';
import { Logger } from '../Logger';

export class FileActivityHandler {
    private static readonly DEFAULT_MODULE = 'default';
    private isModuleAccessBeingValidated = false;

    constructor(
        private activityHandler: ActivityHandler,
        private moduleManager: ModuleManager,
        private lastLocationTracker: LastLocationTracker,
        private logger: Logger
    ) {}

    public startFileEvent(workspaceFolder: vscode.WorkspaceFolder | undefined, filePath: string): void {
        const moduleName = this.getModuleName(workspaceFolder, filePath);
        const relativeFilePath = this.getRelativeFilePath(workspaceFolder, filePath);

        this.requestModuleAccess(moduleName, workspaceFolder, filePath);
        this.activityHandler.startFileEvent(moduleName, relativeFilePath);
        this.lastLocationTracker.updateLocation(relativeFilePath, moduleName);
    }

    public endFileEvent(filePath: string | null): void {
        if (filePath) {
            // Convert full path to relative path to match what's stored in ActivityHandler
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
            const relativeFilePath = this.getRelativeFilePath(workspaceFolder, filePath);
            this.activityHandler.endFileEvent(relativeFilePath);
        } else {
            this.activityHandler.endFileEvent(null);
        }
    }

    public fileModified(filePath: string): void {
        // Convert full path to relative path to match what's stored in ActivityHandler
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
        const relativeFilePath = this.getRelativeFilePath(workspaceFolder, filePath);
        this.activityHandler.fileModified(relativeFilePath);
    }

    private async requestModuleAccess(
        moduleName: string,
        workspaceFolder: vscode.WorkspaceFolder | undefined,
        filePath: string
    ): Promise<void> {
        if (this.isModuleAccessBeingValidated || 
            this.moduleManager.isModuleKnown(moduleName) || 
            this.moduleIsDefaultName(moduleName)) {
            return;
        }

        this.isModuleAccessBeingValidated = true;

        try {
            if (this.moduleManager.isYesToAllEnabled()) {
                await this.enableModule(moduleName, workspaceFolder, filePath);
            } else {
                await this.handleModuleDialog(moduleName, workspaceFolder, filePath);
            }
        } finally {
            this.isModuleAccessBeingValidated = false;
        }
    }

    private async handleModuleDialog(
        moduleName: string,
        workspaceFolder: vscode.WorkspaceFolder | undefined,
        filePath: string
    ): Promise<void> {
        const dialog = new ModuleOptInDialog(moduleName);
        const response = await dialog.show();

        if (response === ModuleOptInDialog.YES_RESPONSE) {
            await this.enableModule(moduleName, workspaceFolder, filePath);
        } else if (response === ModuleOptInDialog.NO_RESPONSE) {
            this.moduleManager.disableModule(moduleName);
        } else if (response === ModuleOptInDialog.YES_TO_ALL_RESPONSE) {
            await this.enableModule(moduleName, workspaceFolder, filePath);
            this.moduleManager.enableYesToAll();
        }
    }

    private async enableModule(
        moduleName: string,
        workspaceFolder: vscode.WorkspaceFolder | undefined,
        filePath: string
    ): Promise<void> {
        const moduleRootDir = this.getModuleRoot(workspaceFolder, filePath);
        this.moduleManager.enableModule(moduleName, moduleRootDir);
    }

    private moduleIsDefaultName(moduleName: string): boolean {
        return moduleName === FileActivityHandler.DEFAULT_MODULE;
    }

    private getModuleName(
        workspaceFolder: vscode.WorkspaceFolder | undefined,
        _filePath: string
    ): string {
        if (workspaceFolder) {
            return workspaceFolder.name;
        }
        return FileActivityHandler.DEFAULT_MODULE;
    }

    private getModuleRoot(
        workspaceFolder: vscode.WorkspaceFolder | undefined,
        _filePath: string
    ): string | undefined {
        if (workspaceFolder) {
            return workspaceFolder.uri.fsPath;
        }
        return undefined;
    }

    public static getFullFilePathOrDefault(
        filePath: string,
        workspaceFolder: vscode.WorkspaceFolder | undefined,
        defaultFilePath: string
    ): string {
        if (!workspaceFolder) {
            return defaultFilePath;
        }

        const workspacePath = workspaceFolder.uri.fsPath;
        if (filePath.startsWith(workspacePath)) {
            // Return relative path from workspace root
            return path.relative(workspacePath, filePath);
        }

        return defaultFilePath;
    }

    private getRelativeFilePath(
        workspaceFolder: vscode.WorkspaceFolder | undefined,
        filePath: string
    ): string {
        return FileActivityHandler.getFullFilePathOrDefault(
            filePath,
            workspaceFolder,
            path.basename(filePath)
        );
    }
}


