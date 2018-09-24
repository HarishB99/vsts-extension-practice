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
    console.log('[i] Update approvals: Started');
    console.log();
    connection.getReleaseApi()
    .then(api => {
        return Promise.all([
            api.getRelease(process.env.SYSTEM_TEAMPROJECT, parseInt(process.env.RELEASE_RELEASEID)),
            connection.getReleaseApi()
        ]);
        // return api.updateReleaseApprovals([{
        //     approvalType: 'postDeploy',
        //     approver: {
        //         id: primary_approver
        //     },
        //     isAutomated: false,
        //     status: 'reassigned'
        // }], process.env.SYSTEM_TEAMPROJECT);
    })
    .then(results => {
        const release = results[0];
        const secondApi = results[1];
        // console.log(`${JSON.stringify(release)}`);
        release.environments[0].postApprovalsSnapshot.approvalOptions = {
            timeoutInMinutes: 30
        };

        release.environments[0].postApprovalsSnapshot.approvals = [{
            isAutomated: false,
            approver: {
                id: primary_approver
            },
            isNotificationOn: true
        }];
        console.log(`Update release: ${JSON.stringify(release)}`);
        return secondApi.updateRelease(release, process.env.SYSTEM_TEAMPROJECT, release.id)
    })
    // .then(approvals => {
    //     console.log(`Updated Approvals: ${JSON.stringify(approvals)}`);
    //     return connection.getReleaseApi();
    // }).then(api => {
    //     return api.getApprovals(process.env.SYSTEM_TEAMPROJECT);
    // }).then(approvals => {
    //     console.log(`Approvals: ${JSON.stringify(approvals)}`);
    //     return connection.getReleaseApi();
    // }).then(api => {
    //     return api.getReleaseDefinition(process.env.SYSTEM_TEAMPROJECT, process.env.RELEASE_DEFINITIONID);
    // }).then(definition => {
    //     console.log(`Definitions: ${JSON.stringify(definition)}`);
    //     console.log();
    //     console.log(`[+] Update approvals: Complete`);
    // })
    .then(release => {
        console.log(`After update: ${JSON.stringify(release)}`);
    })
    .catch(error => {
        console.log('[-] Update approvals: Failure');
        console.error(`Reason: ${error}`);
        console.log();
        console.log('[-] Executing task: Failure');
        console.log('Reason: Update approvals: Failure');
    });
} catch (error) {
    console.log();
    console.log('[-] Executing task: Failure');
    console.log(`Reason: ${error}`);
}