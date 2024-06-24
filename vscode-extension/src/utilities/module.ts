/**
 * This class could keep track of modules so we can check them on the
 * fly and also see if they have changed
 * 1. Get workspace root paths
 * 2. Map them to the module names
 * 3. Remove any ignored directories from mapping
 * 4. Remove any directories mentioned in project ignore file
 */
class Module {
  private configFilePath: string
  private moduleMap: {[moduleName: string]: string} | {} = {}

  constructor(configFilePath: string) {
    this.configFilePath = configFilePath

    // Set modules from config file

    // Create watcher for changed modules

    // Create watcher for changed config
  }

  getModuleName(filePath: string): string | null {
    // TODO: Implement
    console.log(filePath)
    return null
  }
}
