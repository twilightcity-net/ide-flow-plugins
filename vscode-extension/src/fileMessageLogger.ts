import {createWriteStream, fstat, mkdirSync, WriteStream} from 'fs'
import path = require('path')
import {window} from 'vscode'

const activeFlowFileName = 'active.flow'
const flowDirectory = '.flow/'

export class FileMessageLogger {
  constructor(private readonly workspaceDirectory: string) {
    this.workspaceDirectory = workspaceDirectory

    // Create the .flow directory if it doesn't exist.
    mkdirSync(this.workspaceDirectory + flowDirectory, {recursive: true})

    // Open the active.flow file. Since we are gonna write to it multiple
    // times, better to open it in append mode and keep the handle.
    this.activeFileStream = createWriteStream(
      this.workspaceDirectory + '/' + flowDirectory + activeFlowFileName,
    )
    // TODO: Better error handling
    this.activeFileStream.on('error', (error: any) => {
      window.showErrorMessage(error)
    })
    // TODO: Figure out how to get drain to work
    this.activeFileStream.once('drain', () => {
      this.shouldSendToQueue = false
      this.processQueue()
    })
  }
  private activeFileStream: WriteStream | null = null
  private shouldSendToQueue: boolean = false
  private writeQueue: string[] = []

  flush() {
    console.log('Flushing file message logger')
  }

  // Grab the messages from the top of the queue and write them to the file.
  // moving on to the next message in the queue.
  processQueue() {
    const message = this.writeQueue.shift()
    if (message) {
      this.writeMessage(message)
      this.processQueue()
    }
  }

  writeMessage(message: string) {
    try {
      if (this.shouldSendToQueue) {
        this.writeQueue.push(message)
      } else if (this.activeFileStream) {
        console.log('Writing message to file message logger')
        const buffer = this.activeFileStream.write(message + '\n')
        if (!buffer) {
          // If buffer is full then we should queue the messages.
          this.shouldSendToQueue = true
        }
      } else {
        throw new Error('No active file stream')
      }
    } catch (error: any) {
      window.showErrorMessage(error.message)
    }
  }
}
