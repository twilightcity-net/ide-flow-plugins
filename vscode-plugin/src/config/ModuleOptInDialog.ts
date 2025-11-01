import * as vscode from 'vscode';

export class ModuleOptInDialog {
    public static readonly YES_RESPONSE = 'Yes';
    public static readonly NO_RESPONSE = 'No';
    public static readonly YES_TO_ALL_RESPONSE = 'Yes to All';

    constructor(private moduleName: string) {}

    async show(): Promise<string | undefined> {
        const message = `Would you like to record activity for module '${this.moduleName}'?`;
        
        const response = await vscode.window.showInformationMessage(
            message,
            { modal: true },
            ModuleOptInDialog.YES_RESPONSE,
            ModuleOptInDialog.YES_TO_ALL_RESPONSE,
            ModuleOptInDialog.NO_RESPONSE
        );

        return response;
    }
}


