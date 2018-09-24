const task = require('vsts-task-lib/task');
const azure_devops_api = require('azure-devops-node-api');

try {
    console.log();
    console.log('[i] Executing task: Started');
    console.log();
    console.log('[i] Storing input variables: Started');
    console.log();
    let primary_approver = JSON.parse(task.getInput('primary_approver', true));
    console.log(`[i] primary_approver: ${primary_approver}`);
    let secondary_approver = JSON.parse(task.getInput('secondary_approver', true));
    console.log(`[i] secondary_approver: ${secondary_approver}`);
    let approval_timeout = task.getInput('approval_timeout', true);
    console.log(`[i] approval_timeout: ${approval_timeout}`);
    console.log(`[i] typeof approval_timeout: ${typeof approval_timeout}`);
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
    })
    .then(results => {
        const release = results[0];
        const secondApi = results[1];
        release.environments[1].postApprovalsSnapshot.approvalOptions = {
            timeoutInMinutes: 30,
            releaseCreatorCanBeApprover: true
        };

        release.environments[1].postApprovalsSnapshot.approvals = [{
            isAutomated: false,
            approver: {
                id: primary_approver[0]
            },
            isNotificationOn: false,
            rank: 1
        }, {
            isAutomated: false,
            approver: {
                id: secondary_approver[0]
            },
            isNotificationOn: false,
            rank: 2
        }];
        console.log(`Update release: ${JSON.stringify(release)}`);
        return secondApi.updateRelease(release, process.env.SYSTEM_TEAMPROJECT, release.id)
    })
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