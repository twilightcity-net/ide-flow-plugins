import {mkdirSync, writeFile} from 'fs'
import {join} from 'path'
import {workspace} from 'vscode'

import {EXTENSION_PATH, CONFIG_FILE_NAME} from '../constants'

export default class Config {
  configFilePath: string
  extensionDir: string
  private config: {[key: string]: string}
  constructor() {
    // Create extension directory if it doesn't exist.
    this.extensionDir = replaceEnvString(EXTENSION_PATH)
    this.createExtensionDirectory()
    this.configFilePath = this.getConfigFilePath()
    this.config = this.getConfig()
  }

  get(key: string): string | undefined {
    return this.config[key]
  }

  set(key: string, value: string): void {
    this.config[key] = value
    this.saveConfig()
  }

  getConfigFilePath(): string {
    let configFilePath = workspace
      .getConfiguration('flowInsight')
      .get('configFilePath') as string | undefined

    if (!configFilePath) {
      return join(this.extensionDir, CONFIG_FILE_NAME)
    } else {
      return replaceEnvString(configFilePath)
    }
  }

  getConfig(): any {
    try {
      const config = require(this.configFilePath)
      return config
    } catch (error) {
      // No file exists, so we create one.
      this.createConfig()
      return {}
    }
  }

  saveConfig(): void {
    writeFile(
      this.configFilePath,
      JSON.stringify(this.config, null, 2),
      (error) => {
        if (error) {
          throw error
        }
      },
    )
  }

  createExtensionDirectory(): void {
    mkdirSync(this.extensionDir, {recursive: true})
  }

  createConfig(): void {
    writeFile(this.configFilePath, '{}', (error) => {
      if (error) {
        throw error
      }
    })
  }
}

const ENV_REGEX = /\$\{env:(.*)\}/
function replaceEnvString(configFilePath: string): string {
  const match = configFilePath.match(ENV_REGEX)
  if (match) {
    const env = process.env[match[1]]
    if (!env) {
      throw new Error(`No environment variable found for ${env}`)
    }
    return configFilePath.replace(match[0], env)
  }
  return configFilePath
}
