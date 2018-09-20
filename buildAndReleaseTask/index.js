const task = require('vsts-task-lib/task');
const http = require('http');
const https = require('follow-redirects').https;
const request = require('request');
const azure_devops_api = require('azure-devops-node-api');

try {
    console.log();
    console.log('[i] Executing task: Started');
    console.log();
    console.log('[i] Storing input variables: Started');
    console.log();
    let primary_approver = task.getInput('primary_approver', true);
    console.log(`[i] primary_approver: ${primary_approver}`);
    let secondary_approver = task.getInput('secondary_approver', true);
    console.log(`[i] secondary_approver: ${secondary_approver}`);
    let approval_timeout = task.getInput('approval_timeout', true);
    console.log(`[i] approval_timeout: ${approval_timeout}`);
    console.log();
    console.log('[+] Storing input variables: Complete');
    console.log();
    let authHandler = azure_devops_api.getBearerHandler(
        task.getEndpointAuthorizationParameter('SystemVssConnection', 'AccessToken', false));
    let connection = new azure_devops_api.WebApi(process.env.SYSTEM_TEAMFOUNDATIONSERVERURI, authHandler);
    console.log('[i] Get details from REST endpoint: Started');
    console.log();
    connection.getReleaseApi()
    .then(api => {
        return Promise.all([api.getReleaseDefinition(process.env.SYSTEM_TEAMPROJECT, process.env.RELEASE_DEFINITIONID), api.getApprovals(process.env.SYSTEM_TEAMPROJECT)]);
    }).then(arr => {
        const definition = arr[0];
        const approvals = arr[1];
        console.log(`[i] Release definition: ${JSON.stringify(definition)}`);
        console.log(`[i] Post deploy approvals: ${JSON.stringify(definition.environments[0].postDeployApprovals)}`);
        console.log(`[i] Pre deploy approvals: ${JSON.stringify(definition.environments[0].preDeployApprovals)}`);
        console.log();
        console.log(`[i] Approvals List: ${JSON.stringify(approvals)}`);
        console.log();
        console.log('[+] Get details from REST endpoint: Complete');
        console.log();
        console.log('[+] Executing task: Complete');
        
    }).catch(error => {
        console.log('[-] Get details from REST endpoint: Failure');
        console.error(`Reason: ${error}`);
        console.log();
        console.log('[-] Executing task: Failure');
        console.log('Reason: Get details from REST endpoint: Failure');
    });
} catch (error) {
    console.log();
    console.log('[-] Executing task: Failure');
    console.log(`Reason: ${error}`);
}