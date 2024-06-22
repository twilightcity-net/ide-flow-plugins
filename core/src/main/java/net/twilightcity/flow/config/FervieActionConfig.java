package net.twilightcity.flow.config;

import net.twilightcity.flow.Logger;
import net.twilightcity.flow.activity.JSONConverter;

import java.io.*;
import java.util.List;

public class FervieActionConfig {

    private final File fervieActionConfigFile;
    private final Logger logger;

    private final JSONConverter jsonConverter = new JSONConverter();


    public FervieActionConfig(Logger logger, File fervieActionConfigFile) {
        this.logger = logger;
        this.fervieActionConfigFile = fervieActionConfigFile;
    }

    public FervieActionSet getConfigFromFile() {
        if (!fervieActionConfigFile.exists()) {
            return null;
        }

        StringBuilder contentBuilder = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new FileReader(fervieActionConfigFile)))
        {
            String sCurrentLine;
            while ((sCurrentLine = br.readLine()) != null)
            {
                contentBuilder.append(sCurrentLine).append("\n");
            }

            return (FervieActionSet) jsonConverter.fromPlainJSON(contentBuilder.toString(), FervieActionSet.class);
        }

        catch (IOException e)
        {
            logger.error("Unable to read json module config", e);
        }
        return null;
    }


    public void saveToJson(FervieActionSet fervieActionSet) {
        try (FileWriter fileWriter = new FileWriter(fervieActionConfigFile)){
            String messageAsJson = jsonConverter.toPlainJSON(fervieActionSet);
            fileWriter.write(messageAsJson);

        } catch (Exception e) {
            logger.error("Unable to save json module config", e);
        }
    }

    public static class FervieActionSet {
        private List<FervieAction> fervieActions;

        public FervieActionSet() {}

        public List<FervieAction> getFervieActions() {
            return fervieActions;
        }

        public void setFervieActions(List<FervieAction> fervieActions) {
            this.fervieActions = fervieActions;
        }

    }


    public static class FervieAction {

        private String extensionName;
        private String actionId;
        private String fervieButtonText;
        private String fervieButtonTip;

        public FervieAction(String extensionName, String actionId, String fervieButtonText, String fervieButtonTip) {
            this.extensionName = extensionName;
            this.actionId = actionId;
            this.fervieButtonText = fervieButtonText;
            this.fervieButtonTip = fervieButtonTip;
        }

        public FervieAction() {}

        public String getExtensionName() { return extensionName;}

        public String getActionId() {
            return actionId;
        }

        public String getFervieButtonText() {
            return fervieButtonText;
        }

        public String getFervieButtonTip() {
            return fervieButtonTip;
        }
    }
}
