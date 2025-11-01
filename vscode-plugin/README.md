# FlowInsight Metrics - VSCode Extension

Capture automated Flow activity from your developer experience as you navigate around the code, modify code, and execute tests. This extension tracks your IDE activity and sends it to the FlowInsight developer flow console.

## Features

- **File Activity Tracking**: Automatically tracks which files you open, edit, and navigate
- **Code Modification Tracking**: Monitors when you modify code files
- **Task & Process Execution**: Tracks build tasks, scripts, test runs, and debug sessions
- **Snippet Sharing**: Send code snippets directly to FlowInsight
- **Module Management**: Opt-in per module with "Yes to All" option
- **Automatic Upload**: Periodically uploads activity data to FlowInsight
- **Manual Upload**: Upload flow activity on-demand via command or toolbar button

## Installation

### From VSCode Marketplace

1. Open VSCode
2. Go to Extensions view (View → Extensions or `Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "FlowInsight Metrics"
4. Click **Install**

### From VSIX File

1. Download the `.vsix` file
2. Open VSCode
3. Go to Extensions view
4. Click the **...** menu (three dots) in the Extensions view
5. Select **Install from VSIX...**
6. Choose the downloaded `.vsix` file

### Manual Installation

1. Clone or download this repository
2. Open the `vscode-plugin` directory in VSCode
3. Run `npm install` to install dependencies
4. Run `npm run compile` to build the extension
5. Press `F5` to run the extension in a new Extension Development Host window (or use the Debug panel → Run Extension)

## Configuration

### API Settings

Before using the extension, you must configure your FlowInsight API credentials:

1. Create a file at `~/.flow/settings.json` (or `%USERPROFILE%\.flow\settings.json` on Windows)
2. Add your API configuration:

```json
{
  "apiKey": "your-api-key-here",
  "apiUrl": "https://your-flowinsight-server.com"
}
```

**Note**: Replace `your-api-key-here` with your actual FlowInsight API key and `your-flowinsight-server.com` with your FlowInsight server URL.

### Module Opt-in

The first time you access files in a new module (workspace folder), you'll be prompted:

- **Yes**: Enable tracking for this module only
- **Yes to All**: Enable tracking for this module and automatically enable for all future modules
- **No**: Disable tracking for this module

You can change module settings later by editing `~/.flow/plugins/com.microsoft.vscode/flowinsight-config.json`.

## Usage

### Upload Flow Activity

**Option 1: Command Palette**
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type "Upload to FlowInsight"
3. Select the command

**Option 2: Toolbar Button**
- Click the upload icon in the editor toolbar

**Option 3: Keyboard Shortcut**
- The extension will periodically auto-upload, but you can trigger manual uploads anytime

### Send Snippet to FlowInsight

**Option 1: Keyboard Shortcut**
1. Select code in the editor
2. Press `Cmd+Shift+S` (Mac) or `Ctrl+Shift+S` (Windows/Linux)

**Option 2: Context Menu**
1. Select code in the editor
2. Right-click to open context menu
3. Select "Send Snippet to FlowInsight"

**Supported Sources:**
- **Editor**: Code selected in editor (includes file path and line number)
- **Console**: Text selected in output/console views

## Tracked Activities

The extension automatically tracks:

- **File Navigation**: When you switch between files
- **File Modifications**: When you edit code files
- **Task Execution**: Build tasks, npm scripts, shell scripts, etc.
- **Test Execution**: Test runs and debug sessions
- **IDE Activity**: Window focus changes and deactivation periods

All activity is stored locally in `~/.flow/plugins/com.microsoft.vscode/` and periodically uploaded to FlowInsight.

## File Structure

The extension creates the following directory structure:

```
~/.flow/
├── settings.json                    # API configuration
└── plugins/
    └── com.microsoft.vscode/
        ├── active.flow              # Current session activity (being written)
        ├── flowinsight-config.json   # Module configuration
        ├── fervie-action-config.json # Fervie action configuration
        ├── last-location.json        # Last tracked file location
        ├── publish/                  # Batches ready to upload
        ├── failed/                   # Failed batches (retry next day)
        └── retryNextSession/        # Batches to retry in next session
```

## Commands

The extension provides the following commands (accessible via Command Palette `Ctrl+Shift+P`):

- **`flowinsight.uploadFlow`**: Upload to FlowInsight - Manually upload current flow activity
- **`flowinsight.createSnippet`**: Send Snippet to FlowInsight - Send selected code snippet
- **`flowinsight.registerFervieAction`**: Register a Fervie Action - For extension developers

## Keyboard Shortcuts

| Command | Mac | Windows/Linux |
|---------|-----|---------------|
| Send Snippet to FlowInsight | `Cmd+Shift+S` | `Ctrl+Shift+S` |

## Requirements

- VSCode version 1.60.0 or higher

## Troubleshooting

### Extension Not Tracking Activity

1. **Check API Configuration**: Ensure `~/.flow/settings.json` exists and contains valid API key and URL
2. **Check Module Status**: Verify the module is enabled in `flowinsight-config.json`
3. **Check Extension Status**: Open Output panel → Select "FlowInsight Metrics" to view logs
4. **Restart VSCode**: Try reloading the window (`Ctrl+R` / `Cmd+R`)

### Upload Fails

1. **Check API Key**: Verify your API key is correct in `settings.json`
2. **Check Network**: Ensure you can reach the FlowInsight server
3. **Check Logs**: View extension logs in Output panel for detailed error messages

### Module Not Prompting

- Modules are only prompted once. Check `flowinsight-config.json` to see current module status
- You can manually edit the configuration file to enable/disable modules

## Development

### Building from Source

```bash
cd vscode-plugin
npm install
npm run compile
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:unit     # Run unit tests only
npm run test:integration  # Run integration tests
```

### Debugging

1. **Open the workspace**: Open the `vscode-plugin` directory in VSCode (this is your workspace root)
2. **Optional - Set breakpoints**: Open any files in `src/` where you want to set breakpoints (e.g., `src/extension.ts`, `src/controller/FlowController.ts`, etc.)
3. **Start debugging**: Press `F5` (or `Fn+F5` on Mac if function keys are mapped to system functions)
   - **Note**: You can press F5 from anywhere in the workspace - no specific file needs to be open or focused
   - The extension will automatically compile before launching (via `preLaunchTask`)
   - Alternatively: Open the Run and Debug panel (`Cmd+Shift+D` on Mac, `Ctrl+Shift+D` on Windows/Linux), select "Run Extension" from the dropdown, and click the green play button
4. **Extension Development Host**: A new VSCode window will open labeled "[Extension Development Host]"
5. **Test your extension**: In the new window, the extension will be active and ready to test
6. **Debug**: 
   - Breakpoints in `src/` files will work (source maps are enabled)
   - View logs in the Debug Console of the original VSCode window
   - Use the Debug toolbar to pause, step, and continue

## Support

For issues, questions, or contributions, please refer to the main project repository.

## License

This extension is open source under an Apache 2 License.

## See Also

- [FlowInsight Developer Flow Console](https://flowinsight.com)
- IntelliJ Plugin (for comparison/reference)

