# VSCode Plugin Feature Parity Todo List

## Missing Features (compared to IntelliJ Plugin)

- [x] 1. **Snippet Creation Command** - Implement "Send Snippet to FlowInsight" command with keyboard shortcut (Cmd+Shift+S)
- [x] 2. **Flush Batch Command Implementation** - Implement uploadFlow command that calls flushBatch/start if needed
- [x] 3. **Module Opt-in Dialog** - Add dialog for module access confirmation (Yes/No/Yes to All)
- [x] 4. **Action File Watcher** - Implement file watcher for fervie.action files (equivalent to FervieActionProcessor.watchLoop)
- [x] 5. **FlowClient/API Integration** - Implement actual API publishing in FlowPublisher.publishBatch() with FlowClient
- [x] 6. **Controller/State Management** - Create FlowController class to manage active/inactive state, API client initialization
- [x] 7. **Process Execution Tracking** - Track all process executions (tasks, builds, scripts) via TaskExecutionHandler, plus test executions via TestExecutionTracker
- [x] 8. **Module Manager Enhancements** - Add "yes to all" functionality, module root directory tracking, and proper config file handling
- [x] 9. **Proper Initialization** - Ensure FlowPublisher.start() is called and action watcher is started on activation
- [x] 10. **File Path Resolution** - Implement proper relative file paths from module root (like VirtualFileActivityHandler.getFullFilePathOrDefault)
- [x] 11. **Extension Point Integration** - Ensure FervieExtensionPointManager properly integrates with action dispatcher
- [x] 12. **Context Menu Integration** - Add snippet command to editor context menu (like IntelliJ's EditorPopupMenu)

## Notes

- FlowClient API integration (TODO #5) is complete with full HTTP implementation matching IntelliJ plugin behavior.
- Process execution tracking (TODO #7) is complete with TaskExecutionHandler tracking all VSCode tasks (builds, scripts, applications) and TestExecutionTracker tracking test-specific debug sessions, providing full parity with IntelliJ's ProcessExecutionHandler.

