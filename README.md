
# Get Started with Harish Release Tools

## Install the extension

Firstly, change the current working directory to `buildAndReleaseTask`.

* Run `npm install` to install all the required npm packages listed in `/buildAndReleaseTask/package.json`

Next, at the root of this directory,

* Run `npm install` to install all the required npm packages listed in `/package.json`

* Run `npm run build` to build the .vsix extension file at the root of this directory

* Refer to [this section](https://docs.microsoft.com/en-us/azure/devops/marketplace/get-tfs-extensions?view=tfs-2018#install-extensions-for-disconnected-tfs) of the Microsoft website for documentation on how to install extensions for disconnected TFS.

  * Follow the instructions found in the documentation, starting from the `Upload to Team Foundation Server` portion

## Set-up required to use the extension properly

__Firstly__, the extension is expected to automatically configure approvals for the subsequent __Stage__ in a __Release Pipeline__, with the help of a release task coded in NodeJS.

In other words, assuming we have __two__ stages in the pipeline, namely `Stage-1` and `Stage-2`:

* The release task is added to one of the agents in `Stage-1` of the pipeline

* This release task will configure approvals for the subsequent Stage, i.e. `Stage-2`

As it can be seen from above, to use the extension, at least __TWO__ stages are required, with the release task packaged in the extension added to one of the agent jobs running in the __FIRST__ stage, allowing this release task to configure approvals for the second stage.

__Secondly__, the account named `Project Collection Build Service (<ORGANISATION_NAME>)` must be granted several permissions to allow the extension to perform its expected functions.

> __** NOTE__: `<ORGANISATION_NAME>` refers to the name of the TFS organization that is making use of the extension.

* At the project level, the `Bypass rules on work item updates` permission needs to be granted to the abovementioned account.

  1. Navigate to the `Settings` hub in your project.

  2. Click on `Security`

  ![Navigate to Project Settings, and then Security](/docs/Project_Settings_-_Navigate_to_Security_(2).JPG)

  3. Next, search for `Project Collection Build Service` and then click on the abovementioned account name.

  4. Make sure the permission `Bypass rules on work item updates` is allowed.

  ![Grant "Bypass Rules on work item updates" permission to "Project Collection Build Service (<ORGANISATION_NAME>)"](/docs/project_settings.gif)

* The `Manage release approvers` permission needs to be granted to the abovementioned account so that the release task packaged with the extension can configure the approvals as mentioned in the previous section.

  1. Navigate to the `Releases` hub in your project

  2. Click on the ellipsis icon `...` in the right window
  
  3. Click on `Security` in the context menu that appears.

  ![Navigate to Releases, and then Security](/docs/Release_pipeline_-_Navigate_to_Security_(2).JPG)

  4. Click on `Project Collection Build Service (<ORGANISATION_NAME>)` account

  > __** NOTE__: If you are unable to find the account name, click on the `+ Add` button at the top to find and add the account to this `Permissions` page.

  5. Make sure the permission `Manage release approvers` is allowed.
  
  ![Grant "Manage release approvers" permission to "Project Collection Build Service (<ORGANISATION_NAME>)"](/docs/Release_pipeline_-_Grant_Permissions_(2).JPG)

* To learn more about permissions in TFS, [click here](https://docs.microsoft.com/en-us/azure/devops/organizations/security/about-permissions?view=tfs-2018).

__Finally__, and this is optional, the Work Item Section named `Artifacts`, which will be created by the extension, appears at the bottom of the Work Item Form by default. If you wish to configure it to appear at the top of the `Description` section instead, you can perform the following:

  * Navigate to the `Work Items` hub in your project

  * Click on `+ New Work Item`

  * Click on `Feature` (though clicking on any of the Work Item types should work, as the extension creates a Feature Work Item, it is safer to configure this type.)

    ![Create New Feature Work Item](/docs/Work_Item_-_New_Feature_(2).JPG)
  
  * Click on the ellipsis icon `...` in the right window

  * Click on `Customize` in the context menu that appears

  * Click on `Leave` in the pop-up that appears

  * Scroll to the bottom of the `Layout` tab

  * Drag the `Artifacts` section to the top of the `Description` section

    ![Editing Work Item UI](/docs/work_item_ui.gif)
