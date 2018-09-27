const task = require('vsts-task-lib/task');
const azure_devops_api = require('azure-devops-node-api');

try {
    console.log();
    console.log('[i] Executing task: Started');
    console.log();
    console.log('[i] Storing input variables: Started');
    console.log();
        let pre_primary_approvers = null;
        let pre_secondary_approvers = null;
        let pre_approval_timeout = null;

        let post_primary_approvers = null;
        let post_secondary_approvers = null;
        let post_approval_timeout = null;
        const pre_enabled = task.getBoolInput('pre_enabled', true);
            console.log(`[i] pre_enabled: ${pre_enabled}`);
        const post_enabled = task.getBoolInput('post_enabled', true);
            console.log(`[i] post_enabled: ${post_enabled}`);

        if (pre_enabled) {
            pre_primary_approvers = JSON.parse(task.getInput('pre_primary_approvers', true));
                console.log(`[i] pre_primary_approvers: ${pre_primary_approvers}`);
            pre_secondary_approvers = JSON.parse(task.getInput('pre_secondary_approvers', true));
                console.log(`[i] pre_secondary_approvers: ${pre_secondary_approvers}`);
            pre_approval_timeout = parseInt(task.getInput('pre_approval_timeout', true));
                console.log(`[i] typeof pre_approval_timeout: ${typeof pre_approval_timeout}`);
        }
        
        if (post_enabled) {
            post_primary_approvers = JSON.parse(task.getInput('post_primary_approvers', true));
                console.log(`[i] post_primary_approvers: ${post_primary_approvers}`); 
            post_secondary_approvers = JSON.parse(task.getInput('post_secondary_approvers', true));
                console.log(`[i] post_secondary_approvers: ${post_secondary_approvers}`);
            post_approval_timeout = parseInt(task.getInput('post_approval_timeout', true));
                console.log(`[i] typeof post_approval_timeout: ${typeof post_approval_timeout}`);
        }
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
        let indexOfInterest = 0;
        for (let i = 0; i < release.environments.length; i++) {
            const environment = release.environments[i];
            if (environment.name === process.env.RELEASE_ENVIRONMENTNAME) {
                indexOfInterest = ++i;
                break;
            }
        }

        if (pre_enabled) {
            release.environments[indexOfInterest].preApprovalsSnapshot.approvalOptions = {
                timeoutInMinutes: pre_approval_timeout,
                releaseCreatorCanBeApprover: true
            };

            const preApprovalsArray = [];

            for (let i = 0; i < pre_primary_approvers.length; i++) {
                const pre_primary_approver = pre_primary_approvers[i];
                let currentIndex = i;
                preApprovalsArray.push({
                    isAutomated: false,
                    approver: {
                        id: pre_primary_approver
                    },
                    isNotificationOn: false,
                    rank: ++currentIndex
                });
            }
            for (let i = 0; i < pre_secondary_approvers.length; i++) {
                const pre_secondary_approver = pre_secondary_approvers[i];
                let currentIndex = i;
                preApprovalsArray.push({
                    isAutomated: false,
                    approver: {
                        id: pre_secondary_approver
                    },
                    isNotificationOn: false,
                    rank: ++currentIndex
                });
            }
            release.environments[indexOfInterest].preApprovalsSnapshot.approvals = preApprovalsArray;
        }
        
        if (post_enabled) {
            release.environments[indexOfInterest].postApprovalsSnapshot.approvalOptions = {
                timeoutInMinutes: post_approval_timeout,
                releaseCreatorCanBeApprover: true
            };

            const postApprovalsArray = [];

            for (let i = 0; i < post_primary_approvers.length; i++) {
                const post_primary_approver = post_primary_approvers[i];
                let currentIndex = i;
                postApprovalsArray.push({
                    isAutomated: false,
                    approver: {
                        id: post_primary_approver
                    },
                    isNotificationOn: false,
                    rank: ++currentIndex
                });
            }
            for (let i = 0; i < post_secondary_approvers.length; i++) {
                const post_secondary_approver = post_secondary_approvers[i];
                let currentIndex = i;
                postApprovalsArray.push({
                    isAutomated: false,
                    approver: {
                        id: post_secondary_approver
                    },
                    isNotificationOn: false,
                    rank: ++currentIndex
                });
            }
            release.environments[indexOfInterest].postApprovalsSnapshot.approvals = postApprovalsArray;
        }
        console.log(`[i] Information to be updated: ${JSON.stringify(release)}`);
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