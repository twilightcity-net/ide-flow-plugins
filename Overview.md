# FlowInsight Metrics Instrumentation Specification

The flow plugins work by instrumenting IDEs, editors, build tools, or other tooling to capture events and activity data that can be incorporated into the flow feeds generated by FlowInsight.

## File Locations

Each plugin should output data into it's own folder within the `~/.flow` directory, and append to an active.flow file.  For example, the intellij plugin writes to:

`~/.flow/plugins/com.jetbrains.intellij/active.flow`

For a new plugin, write to a different folder.  Additions to the file are expected to be append only.

## Data Types

There are 5 supported datatypes that FlowInsight knows how to parse and incorporate into the feeds:

* EditorActivity
* ExecutionActivity
* ModificationActivity
* ExternalActivity
* Event

Each data type is written to the file on a separate line, in the format of: Datatype=json

For example:

`EditorActivity={"durationInSeconds":44,"endTime":"2022-05-29T11:58:19","module":"flow-insight","filePath":"/public/app/App.js","modified":false}`

### EditorActivity

EditorActivity represents the duration in seconds a user views a file in the editor before switching to another file.  There is a minimum threshold of 3 seconds configured in the plugin to prevent rapidly navigating through files to be considered activity within a file.

When a file is first opened, nothing is written to the active.flow file.  When switching to another file, the previously focused file's activity is written to the active.flow file if it's active duration is greater than the 3 second threshold.

Other properties:

* endTime: The endTime represents the UTC time of the local machine, the end of the activity.

* module: The project module containing scope of the file being viewed in the editor.

* filePath: The full path to the file, relative to the containing project module.

* modified: If the file is modified during the duration, the modified property should be set to true.

### ExecutionActivity

ExecutionActivity represents the duration in second of an executable process, usually a unit test run from the IDE.  Minimum execution time is rounded up to 1 second.  Any executable run, such as a build process run, can be represented by an ExecutionActivity.

An example entry in the active.flow file might look like this:

`ExecutionActivity={"durationInSeconds":14,"endTime":"2022-05-29T12:09:32","processName":"JournalResourceSpec","exitCode":0,"executionTaskType":"JUnit","debug":false}`

Other properties:

* endTime: The endTime represents the UTC time of the local machine, the end of the activity when the execution finishes.

* processName: The name of the process from the executable runner within the IDE.  Multiple runs of the same test, should have the same name.

* exitCode: The exit code of the process, 0 if the process ends successful.  If a test fails, the process should exit with a non-zero exit code.

* executionTaskType:  The process type from the executable runner within the IDE.  This is usually a template name.  Anything with "Unit" in the name will be considered a unit test.

* debug: Should be set to true if the debugger was being run for this executable.  The executable run times will be considerably longer if so.


### ModificationActivity

ModificationActivity represents the approximate number of keystrokes within a 30second sample of time.  If there was some keypress activity, we want to count the approximate amount of keystrokes happening to estimate the amount of momentum.  A single copy and paste is counted in terms of a keystroke, and shouldn't be counted in terms of the amount of code pasted.

An example entry in the active.flow file might look like this:

`ModificationActivity={"durationInSeconds":30,"endTime":"2022-05-29T12:00:43","modificationCount":42}`

Properties:

* durationInSeconds: Duration should always be 30 in this case, as we are taking 30 second samples of the number of keystrokes.  If there are no keystrokes during a period, no record is written.  Only when there is at least one keystroke should we write a record.


* endTime: The endTime represents the UTC time of the local machine, the end of the 30s sample.

* modificationCount: The approximate number of keystrokes within the sample period.


### ExternalActivity

ExternalActivity represents the duration of time in which the IDE is deactivated and the window does not have focus.  For example, if we were coding for a while, and then went to our browser to do some things, the IDE is no longer in focus.

An example entry in the active.flow file might look like this:

`ExternalActivity={"durationInSeconds":470,"endTime":"2022-05-29T12:09:12","comment":"Editor Deactivated"}`

Properties:

* durationInSeconds: the amount of time the IDE was deactivated and out of focus.  This activity is written to the active.flow file when the IDE is back in focus.

* endTime: The endTime represents the UTC time of the local machine, the end of the external activity.

* comment: A comment about the external activity, this is not processed, so can be anything that helps identify the activity.

### Event

Events are things that happen in a moment in time rather than over a duration.  There are currently 3 different event types supported.

`Event={"comment":"IDE Shutdown","type":"DEACTIVATE","position":"2022-05-29T12:09:57"}`


`Event={"comment":"IDE Startup","type":"ACTIVATE","position":"2022-05-29T12:21:34"}`


`Event={"comment":"This is a comment","type":"NOTE","position":"2022-05-29T12:22:23"}`


None of these event types are required to generate the FlowInsight feeds.





