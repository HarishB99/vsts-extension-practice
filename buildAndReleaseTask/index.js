const task = require('vsts-task-lib/task');
const http = require('http');
// const https = require('https');
const https = require('follow-redirects').https;
const request = require('request');
const vsts = require('azure-devops-node-api/CoreApi');
const release = require('azure-devops-node-api/ReleaseApi').ReleaseApi;
const azure_devops_api = require('azure-devops-node-api');

try {
    let authHandler = azure_devops_api.getBearerHandler(
        task.getEndpointAuthorizationParameter('SystemVssConnection', 'AccessToken', false));
    // console.log(`System_Teamfoundationuri: ${process.env.SYSTEM_TEAMFOUNDATIONSERVERURI}`);
    let connection = new azure_devops_api.WebApi(process.env.SYSTEM_TEAMFOUNDATIONSERVERURI, authHandler);
    let release_api = connection.getReleaseApi();
    release_api.then(api => {
        return api.getReleases();
    }).then(releases => {
        console.log(`releases: ${releases}`);
        releases.forEach(release => {
            console.log(`release definition: ${release.createdOn.toDateString()}`);
            console.log(`release definition: ${release.releaseDefinition.id}`);
        });
    }).catch(error => {
        console.error(`error: ${error}`);
    });
    // new vsts.CoreApi().rest
    console.log();
    console.log('[i] Executing task: Started');
    console.log();
    console.log('[i] Storing input variables: Started');
    let primary_approver = task.getInput('primary_approver', true);
    console.log(`[i] primary_approver: ${primary_approver}`);
    let secondary_approver = task.getInput('secondary_approver', true);
    console.log(`[i] secondary_approver: ${secondary_approver}`);
    let approval_timeout = task.getInput('approval_timeout', true);
    console.log(`[i] approval_timeout: ${approval_timeout}`);
    console.log('[+] Storing input variables: Complete');
    console.log();
    console.log('[i] Printing out process variables: Started');
    console.log();
    console.log(process.env);
    console.log();
    console.log('[+] Printing out process variables: Completed');
    console.log();
    console.log('[i] Attempting to retrieve secret variable: Started');
    let token = task.getEndpointAuthorizationParameter('SystemVssConnection', 'AccessToken', false);
    console.log(`token: ${token}`);
    console.log('[+] Attempting to retrieve secret variable: Complete');
    console.log();
    console.log('[i] Attempting to get release definitions: Started');
    new release(process.env.SYSTEM_TEAMFOUNDATIONSERVERURI).getReleaseDefinitions(process.env.BUILD_PROJECTNAME)
    .then(definitions => {
        console.log();
        console.log(`definitions: ${definitions}`);
        console.log();
    })
    .then(() => {
        return console.log('[+] Attempting to get release definitions: Completed');
    })
    .catch(error => {
        console.error('[-] Attempting to get release definitions: Failure');
        console.error(`Reason: ${error}`);
    });
    console.log();
    console.log('[i] Attempting to get releases: Started');
    new release(process.env.SYSTEM_TEAMFOUNDATIONSERVERURI).getReleases(process.env.BUILD_PROJECTNAME)
    .then(releases => {
        console.log();
        console.log(`releases: ${releases}`);
        console.log();
    })
    .then(() => {
        return console.log('[+] Attempting to get releases: Completed');
    })
    .catch(error => {
        console.error('[-] Attempting to get releases: Failure');
        console.error(`Reason: ${error}`);
    });
    console.log();
} catch (error) {
    console.log();
    console.log('[-] Executing task: Failure');
    console.log(`Reason: ${error}`);
}