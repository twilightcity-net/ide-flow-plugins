package net.twilightcity.flow.activity;

import net.twilightcity.flow.Logger;

import java.io.File;
import java.io.FileWriter;

public class LastLocationTracker {

    private final Logger logger;
    private final File lastLocationFile;

    private final JSONConverter jsonConverter = new JSONConverter();

    public LastLocationTracker(Logger logger, File lastLocationFile) {
        this.logger = logger;
        this.lastLocationFile = lastLocationFile;
    }

    public void track(String moduleName, String filePath) {
        LastLocationInfo data = new LastLocationInfo(moduleName, filePath);
        saveToJson(data);
    }

    private void saveToJson(LastLocationInfo data) {
        try (FileWriter fileWriter = new FileWriter(lastLocationFile)){
            String messageAsJson = jsonConverter.toPlainJSON(data);
            fileWriter.write(messageAsJson);

        } catch (Exception e) {
            logger.error("Unable to save json last location info", e);
        }
    }

    public static class LastLocationInfo {
        private String module;
        private String lastLocation;

        LastLocationInfo() {}

        LastLocationInfo(String module, String lastLocation) {
            this.module = module;
            this.lastLocation = lastLocation;
        }

        public String getModule() {
            return module;
        }

        public void setModule(String module) {
            this.module = module;
        }

        public String getLastLocation() {
            return lastLocation;
        }

        public void setLastLocation(String lastLocation) {
            this.lastLocation = lastLocation;
        }
    }


}
