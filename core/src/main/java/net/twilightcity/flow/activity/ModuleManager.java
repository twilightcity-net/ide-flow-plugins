package net.twilightcity.flow.activity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import net.twilightcity.flow.Logger;

import java.io.*;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class ModuleManager {

    private final Logger logger;
    private final File moduleConfigFile;

    private List<ModuleConfig> moduleConfigs = new ArrayList<>();

    private Set<String> enabledModules = new HashSet<>();
    private Set<String> disabledModules = new HashSet<>();

    private JSONConverter jsonConverter = new JSONConverter();

    private boolean isInitialized;

    public ModuleManager(Logger logger, File moduleConfigFile) {
        this.logger = logger;
        this.moduleConfigFile = moduleConfigFile;
        this.isInitialized = false;
        initModuleConfigFromFile();
    }

    public boolean isModuleEnabled(String moduleName) {
        return enabledModules.contains(moduleName);
    }

    public boolean isModuleKnown(String moduleName) {
        return enabledModules.contains(moduleName) || disabledModules.contains(moduleName);
    }

    public void enableModule(String moduleName, String rootDir) {
        logger.info("Enabling activity recording for module "+moduleName + " in FlowInsight");
        ModuleConfig config = new ModuleConfig(moduleName, rootDir);
        moduleConfigs.add(config);
        enabledModules.add(moduleName);
        saveToJson();
    }

    public void disableModule(String moduleName) {
        logger.info("Disabling activity recording for module "+moduleName + " in FlowInsight");
        disabledModules.add(moduleName);
        saveToJson();
    }


    private void initModuleConfigFromFile() {
        if (!moduleConfigFile.exists()) {
            return;
        }

        StringBuilder contentBuilder = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new FileReader(moduleConfigFile)))
        {
            String sCurrentLine;
            while ((sCurrentLine = br.readLine()) != null)
            {
                contentBuilder.append(sCurrentLine).append("\n");
            }
            ModuleConfigSet moduleConfigSet = jsonConverter.fromPlainJSON(contentBuilder.toString(), ModuleConfigSet.class);
            initConfig(moduleConfigSet);
        }
        catch (IOException e)
        {
            logger.error("Unable to read json module config", e);
        }
    }

    private void initConfig(ModuleConfigSet moduleConfigSet) {
        this.moduleConfigs = moduleConfigSet.getModules();
        this.disabledModules = new HashSet<>(moduleConfigSet.getDisabled());

        for (ModuleConfig config : this.moduleConfigs) {
            this.enabledModules.add(config.getModuleName());
        }
    }

    private void saveToJson() {
        ModuleConfigSet config = new ModuleConfigSet();
        config.setModules(moduleConfigs);
        config.setDisabled(new ArrayList<>(disabledModules));

        try (FileWriter fileWriter = new FileWriter(moduleConfigFile)){
            String messageAsJson = jsonConverter.toPlainJSON(config);
            fileWriter.write(messageAsJson);

        } catch (Exception e) {
            logger.error("Unable to save json module config", e);
        }
    }

    public static class ModuleConfigSet {
        private List<ModuleConfig> modules;
        private List<String> disabled;

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
