
# Get Started with Harish Release Tools

## Install the extension

At the root of this directory,

* Run `npm install` to install all the required npm packages listed in `package.json`

* Run `npm run build` to build the .vsix extension file at the root of this directory

* Refer to [this section](https://docs.microsoft.com/en-us/azure/devops/marketplace/get-tfs-extensions?view=tfs-2018#install-extensions-for-disconnected-tfs) of the Microsoft website for documentation on how to install extensions for disconnected TFS.

  * Follow the instructions found in the documentation, starting from the `Upload to Team Foundation Server` portion

## Set-up required to use the extension properly

__Firstly__, the extension is expected to automatically configure approvals for the subsequent __Stage__ in a __Release Pipeline__, with the help of a release task coded in NodeJS.

In other words, assuming we have __two__ stages in the pipeline, namely `Stage-1` and `Stage-2`:

* The release task is added to one of the agents in `Stage-1` of the pipeline

* This release task will configure approvals for the subsequent Stage, i.e. `Stage-2`

As it can be seen from above, to use the extension, at least __TWO__ stages are required, with the release task packaged in the extension added to one of the agent jobs running in the __FIRST__ stage, allowing this release task to configure approvals for the second stage.

__Secondly__, the account named `Project Collection Build Service (<ORGANISATION_NAME>)` must be granted several permissions at different levels so as to allow the extension to perform its expected functions.

* To learn more about permissions in TFS, [click here](https://docs.microsoft.com/en-us/azure/devops/organizations/security/about-permissions?view=tfs-2018).
