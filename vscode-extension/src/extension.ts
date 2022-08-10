// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log('context', context)

  // We can use onDidChangeTextDocument to count the number of changes made
  // in a given time frame.
  vscode.workspace.onDidChangeTextDocument(
    (change) => {
      console.log('change', change)
    },
    null,
    context.subscriptions,
  )

  // We can use onDidChangeActiveTextEditor to see when they click around
  // between editors.
  // NOTE: If they click on non text files, this event is called but without
  // a document. This includes clicking on a file in the sidebar.
  let activeFileName = vscode.window.activeTextEditor?.document.fileName
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    // Could potentially use this to detect any file that was clicked on to
    // view in VSCode, we can't guarantee the format can be seen in VSCode.
    const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab
    if (activeTab) {
      // TODO: Figure out exactly what types are possible here.
      const activeFileName = (activeTab as any).input.uri.path
      console.log('activeTab', activeFileName)
    }

    const newFileName = editor?.document.fileName
    if (newFileName !== activeFileName) {
      activeFileName = newFileName
      console.log('didChangeActiveTextEditor', newFileName)
    }
  })

  vscode.window.tabGroups.onDidChangeTabs((tabs) => {
    console.log('didChangeTabs', tabs)
  })

  // We can use onDidChangeWindowState to see when they lose focus of
  // the VSCode window they are using.
  // NOTE: It fired when I clicked on another VSCode window that wasn't
  // the one running the extension. Also fired
  // when I click on anything outside of the VSCode window.
  vscode.window.onDidChangeWindowState(({focused}) => {
    console.log('focused', focused)
  })
}

// this method is called when your extension is deactivated
export function deactivate() {}
