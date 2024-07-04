# FlowInsight Metrics Plugin

FlowInsight Metrics plugin is designed to work with FlowInsight developer flow console, available at flowinsight.com.

FlowInsight Metrics captures automated Flow activity from your developer experience as you navigate around the code,
modify code, and execute tests.  IDE activity is spooled to a .flow file in your ~/.flow/plugins/com.jetbrains.intellij directory.
This plugin is open source, under an Apache 2 License.

This repository contains IDE plugins for Intellij and VSCode.

## Intellij Plugin Extension

The Intellij plugin has an extension point that allows you to augment the Fervie popup within the FlowInsight tools with
action buttons that call back into the IDE.  When you create an extension, a new action button will be added to the
fervie popup representing your action, then when you activate the button, the FlowInsight tools will run the 
callback of your IDE plugin.

You can specify the extension point, by adding the following extension to your plugin.XML:

`

        <depends>net.twilightcity.flow</depends>

        <extensions defaultExtensionNs="net.twilightcity.flow">
                <ferviePopupByHotkey
                    implementation="your.path.to.ImplementationClass"/>
        </extensions>
`

The interface should implement net.twilightcity.flow.intellij.extension.api.FerviePopupByHotKeyAction, which looks like this:

`

    public interface FerviePopupByHotKeyAction {

        String getActionId();
    
        String getFervieButtonText();
    
        String getFervieButtonTooltip();
    
        void onFervieAction();
    }
`

When you test out the plugin, make sure you have your plugin and the FlowInsight Metrics plugin both enabled, 
and restart your IDE.  When you activate the Fervie popup within the FlowInsight tools, 
you should see your action appear on the popup, and when you click the action, your plugin's onFervieAction() 
method should run.


## Project Setup Instructions

To setup the projects:

`cd core`

`./gradlew idea`

`cd ../intellij-plugin`

`./gradlew idea`

The core plugin also depends on the gridtime-client API, so first, go into the gridtime project, and run:

From gridtime:

`./gradlew pubLocal`

Then from core:

`./gradlew clean check`


Within Intellij:

Create a new empty project.

Import module core using the core.iml (hit the + sign to add a module then select the core.iml file)
Set the project SDK to Java 1.8

Import module intellij-plugin using the intellij-plugin.iml
Set the Module SDK to IDEA 18 Common Edition

You can do this from within the "Open Module Settings" dialog under "SDKs" first add a new Intellj Platform SDK.  Then once the new SDK is added, go to "Modules" tab, select the "intellij-plugin" module, select the "Dependencies" tab within the module, and change the "Module SDK" to your new Intellij Platform SDK.

If you do not have the common edition, you'll need to download and install it on your machine.  Then from this dialog click "New > Intellij Platform SDK" and navigate to the ".app" file for the installation.


