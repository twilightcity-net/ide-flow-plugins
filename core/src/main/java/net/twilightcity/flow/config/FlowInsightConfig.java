package net.twilightcity.flow.config;

import net.twilightcity.flow.Logger;
import net.twilightcity.flow.activity.JSONConverter;

import java.io.*;
import java.util.List;

public class FlowInsightConfig {

    private final File flowInsightConfigFile;
    private final Logger logger;

    private final JSONConverter jsonConverter = new JSONConverter();


    public FlowInsightConfig(Logger logger, File flowInsightConfigFile) {
        this.logger = logger;
        this.flowInsightConfigFile = flowInsightConfigFile;
    }

    public ModuleConfigSet getConfigFromFile() {
        if (!flowInsightConfigFile.exists()) {
            return null;
        }

        StringBuilder contentBuilder = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new FileReader(flowInsightConfigFile)))
        {
            String sCurrentLine;
            while ((sCurrentLine = br.readLine()) != null)
            {
                contentBuilder.append(sCurrentLine).append("\n");
            }

            return (ModuleConfigSet) jsonConverter.fromPlainJSON(contentBuilder.toString(), FlowInsightConfig.ModuleConfigSet.class);
        }

        catch (IOException e)
        {
            logger.error("Unable to read json module config", e);
        }
        return null;
    }


    public void saveToJson(ModuleConfigSet moduleConfigSet) {
        try (FileWriter fileWriter = new FileWriter(flowInsightConfigFile)){
            String messageAsJson = jsonConverter.toPlainJSON(moduleConfigSet);
            fileWriter.write(messageAsJson);

        } catch (Exception e) {
            logger.error("Unable to save json module config", e);
        }
    }

    public static class ModuleConfigSet {
        private Boolean yesToAllEnabled;
        private List<ModuleConfig> modules;
        private List<String> disabled;

        public ModuleConfigSet() {}

        public Boolean getYesToAllEnabled() {
            return yesToAllEnabled;
        }

        public void setYesToAllEnabled(Boolean yesToAllEnabled) {
            this.yesToAllEnabled = yesToAllEnabled;
        }

        public List<ModuleConfig> getModules() {
            return modules;
        }

        public void setModules(List<ModuleConfig> modules) {
            this.modules = modules;
        }

        public List<String> getDisabled() {
            return disabled;
        }

        public void setDisabled(List<String> disabled) {
            this.disabled = disabled;
        }
    }


    public static class ModuleConfig {

        private String moduleName;
        private String rootDir;

        public ModuleConfig(String moduleName, String rootDir) {
            this.moduleName = moduleName;
            this.rootDir = rootDir;
        }

        public ModuleConfig() {}

        public String getModuleName() {
            return moduleName;
        }

        public void setModuleName(String moduleName) {
            this.moduleName = moduleName;
        }

        public String getRootDir() {
            return rootDir;
        }

        public void setRootDir(String rootDir) {
            this.rootDir = rootDir;
        }
    }
}
