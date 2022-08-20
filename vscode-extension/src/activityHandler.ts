const SHORTEST_ACTIVITY_TIME_IN_MS = 3000

// NOTE: Dates should be UTC

export default class ActivityHandler {
  private modificationCount: number = 0
  private recentIdleDurationInMS: number | null = null
  private activeFileActivity: FileActivity | null = null
  private activeProcessMap: Map<string, ProcessActivity> = new Map()

  constructor() {}

  get getRecentIdleDuration() {
    return this.recentIdleDurationInMS
  }

  isSameFile = (newFilePath: string | null) => {
    return !this.isDifferentFile(newFilePath)
  }

  isDifferentFile = (newFilePath: string | null) => {
    if (this.activeFileActivity === null) {
      return newFilePath !== null
    } else {
      return this.activeFileActivity.filePath !== newFilePath
    }
  }

  isOverActivityThreshold = () =>
    this.activeFileActivity !== null &&
    this.activeFileActivity.durationInMS >= SHORTEST_ACTIVITY_TIME_IN_MS

  createFileActivity = (moduleName: string | null, filePath: string | null) => {
    return filePath === null
      ? null
      : new FileActivity(moduleName, filePath, false)
  }

  markExternalActivity = (idleDurationInMS: number, comment: string) => {
    this.recentIdleDurationInMS = idleDurationInMS

    if (idleDurationInMS >= SHORTEST_ACTIVITY_TIME_IN_MS) {
      if (this.activeFileActivity !== null) {
        const duration = this.activeFileActivity.durationInMS - idleDurationInMS
        if (duration > 0) {
          const endTimeInSeconds =
            (new Date().getTime() - idleDurationInMS) * 1000
          // TODO: put in the messageQueue.pushEditorActivity
          console.log(
            'Will be send to message queue',
            duration,
            endTimeInSeconds,
            this.activeFileActivity.module,
            this.activeFileActivity.filePath,
          )
        }
      }
      // TODO: put in the messageQueue.pushExternalActivity
      console.log(
        'Will be send to message queue',
        idleDurationInMS / 1000,
        comment,
      )
      // TODO: Ask Arty about this block as I don't understand its purpose.
      if (this.activeFileActivity !== null) {
        this.activeFileActivity = this.createFileActivity(
          this.activeFileActivity.module,
          this.activeFileActivity.filePath,
        )
      }
    }
  }

  markProcessStarting = (
    processId: number,
    processName: string,
    executionTaskType: string,
    isDebug: boolean,
  ) => {
    const processActivity = new ProcessActivity(
      processName,
      executionTaskType,
      isDebug,
    )
    this.activeProcessMap.set(processId.toString(), processActivity)
  }

  markProcessEnding = (processId: number, exitCode: number) => {
    const processActivity = this.activeProcessMap.get(processId.toString())
    if (processActivity !== undefined) {
      // TODO: put in the messageQueue.pushExecutionActivity
      console.log(
        'Will be send to message queue',
        processActivity.durationInMS / 1000,
        processActivity.processName,
        exitCode,
        processActivity.executionTaskType,
        processActivity.isDebug,
      )

      this.activeProcessMap.delete(processId.toString())
    }
  }

  startFileEvent = (moduleName: string | null, filePath: string | null) => {
    if (this.isDifferentFile(filePath)) {
      if (this.isOverActivityThreshold() && this.activeFileActivity !== null) {
        // TODO: put in the messageQueue.pushEditorActivity
        console.log(
          'Will be send to message queue',
          this.activeFileActivity.durationInMS / 1000,
          this.activeFileActivity.filePath,
          this.activeFileActivity.module,
          this.activeFileActivity.modified,
        )
      }
      this.activeFileActivity = this.createFileActivity(moduleName, filePath)
    }
  }

  endFileEvent = (filePath: string) => {
    if (filePath === null || this.isSameFile(filePath)) {
      this.startFileEvent(null, null)
    }
  }

  fileModified = (filePath: string) => {
    if (this.activeFileActivity !== null && this.isSameFile(filePath)) {
      this.activeFileActivity.modified = true
    }
    this.modificationCount++
  }

  pushModificationActivity = (intervalInSeconds: number) => {
    if (this.modificationCount > 0) {
      // TODO: put in the messageQueue.pushModificationActivity
      console.log(
        'Will be send to message queue',
        intervalInSeconds,
        this.modificationCount,
      )
      this.modificationCount = 0
    }
  }
}

class ProcessActivity {
  constructor(
    processName: string,
    executionTaskType: string,
    isDebug: boolean,
  ) {
    this.processName = processName
    this.executionTaskType = executionTaskType
    this.isDebug = isDebug
    this.timeStartedMS = new Date().getTime()
  }
  processName: string
  executionTaskType: string
  isDebug: boolean
  timeStartedMS: number

  get durationInMS() {
    return new Date().getTime() - this.timeStartedMS
  }

  get durationInSeconds() {
    return this.durationInMS / 1000
  }

  toString = () => {
    return (
      'ProcessActivity [processName=' +
      this.processName +
      ', executionTaskType=' +
      this.executionTaskType +
      ', ' +
      'duration=' +
      this.durationInSeconds +
      ', isDebug=' +
      this.isDebug +
      ']'
    )
  }
}

class FileActivity {
  constructor(
    module: string | null,
    filePath: string | null,
    modified: boolean,
  ) {
    this.module = module
    this.filePath = filePath
    this.modified = modified
    this.timeStartedMS = new Date().getTime()
  }
  module: string | null
  filePath: string | null
  modified: boolean
  timeStartedMS: number

  get durationInMS() {
    return new Date().getTime() - this.timeStartedMS
  }

  get durationInSeconds() {
    return this.durationInMS / 1000
  }

  get toString() {
    return (
      'FileActivity [path=' +
      this.filePath +
      ', modified=' +
      this.modified +
      ', duration=' +
      this.durationInSeconds +
      ']'
    )
  }
}
