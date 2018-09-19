const task = require('vsts-task-lib/task');
const http = require('http');
// const https = require('https');
const https = require('follow-redirects').https;
const request = require('request');
const vsts = require('azure-devops-node-api/CoreApi');
// const release = require('azure-devops-node-api/ReleaseApi').ReleaseApi;
const azure_devops_api = require('azure-devops-node-api');

try {
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
    let authHandler = azure_devops_api.getBearerHandler(
        task.getEndpointAuthorizationParameter('SystemVssConnection', 'AccessToken', false));
    let connection = new azure_devops_api.WebApi(process.env.SYSTEM_TEAMFOUNDATIONSERVERURI, authHandler);
    connection.getReleaseApi()
    .then(api => {
        return api.getReleaseDefinition(process.env.SYSTEM_TEAMPROJECT, process.env.RELEASE_DEFINITIONID);
    }).then(definition => {
        // const releases = arr[0];
        // const releaseDefinition = arr[1];
        // console.log(`releases: ${JSON.stringify(releases)}`);
        // console.log(`releases definitions: ${JSON.stringify(releaseDefinition)}`);
        // releases.forEach(release => {
            // console.log(`release definition: ${release.createdOn.toDateString()}`);
            // console.log(`release definition: ${release.releaseDefinition.id}`);
            // console.log(`release id: ${release.id}`);
        // });
        console.log(`Post deploy approvals: ${JSON.stringify(definition.environments[0].postDeployApprovals)}`);
        console.log(`Pre deploy approvals: ${JSON.stringify(definition.environments[0].preDeployApprovals)}`);
    }).catch(error => {
        console.error(`error: ${error}`);
    });
    console.log();
} catch (error) {
    console.log();
    console.log('[-] Executing task: Failure');
    console.log(`Reason: ${error}`);
}