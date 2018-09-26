const task = require('vsts-task-lib/task');
const azure_devops_api = require('azure-devops-node-api');

try {
    console.log();
    console.log('[i] Executing task: Started');
    console.log();
    console.log('[i] Storing input variables: Started');
    console.log();
    const primary_approver = JSON.parse(task.getInput('primary_approver', true));
    console.log(`[i] primary_approver: ${primary_approver}`);
    const secondary_approver = JSON.parse(task.getInput('secondary_approver', true));
    console.log(`[i] secondary_approver: ${secondary_approver}`);
    const approval_timeout = parseInt(task.getInput('approval_timeout', true));
    console.log(`[i] typeof approval_timeout: ${typeof approval_timeout}`);
    console.log();
    console.log('[+] Storing input variables: Complete');
    console.log();
    const authHandler = azure_devops_api.getBearerHandler(
        task.getEndpointAuthorizationParameter('SystemVssConnection', 'AccessToken', false));
    const connection = new azure_devops_api.WebApi(process.env.SYSTEM_TEAMFOUNDATIONSERVERURI, authHandler);
    connection.getReleaseApi().then(api => {
        console.log(`[i] Retrieve release info: Started`);
        return Promise.all([
            api.getRelease(process.env.SYSTEM_TEAMPROJECT, parseInt(process.env.RELEASE_RELEASEID)),
            connection.getReleaseApi()
        ]);
    }).then(results => {
        console.log(`[+] Retrieve release info: Complete`);
        console.log();
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

        console.log('[i] Update approvals: Started');
        return secondApi.updateRelease(release, process.env.SYSTEM_TEAMPROJECT, release.id)
    }).then(release => {
        console.log();
        console.log(`Updated release: ${JSON.stringify(release)}`);
        console.log();
        console.log(`[+] Update approvals: Complete`);
        console.log();
        console.log(`[+] Executing task: Complete`);
    }).catch(error => {
        console.log();
        console.log('[-] Promise rejected');
        console.log(`Reason: ${error}`);
    });
} catch (error) {
    console.log();
    console.log('[-] Executing task: Failure');
    console.log(`Reason: ${error}`);
}