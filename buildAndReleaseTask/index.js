const task = require('vsts-task-lib/task');
const azure_devops_api = require('azure-devops-node-api');
const mailer = require('nodemailer');

try {
    console.log();
    console.log('[i] Executing task: Started');
    console.log();
    console.log('[i] Storing input variables: Started');
        let pre_primary_approvers = null;
        let pre_secondary_approvers = null;
        let pre_approval_timeout = null;

        let post_primary_approvers = null;
        let post_secondary_approvers = null;
        let post_approval_timeout = null;
        
        const pre_enabled = task.getBoolInput('pre_enabled', true);
        const post_enabled = task.getBoolInput('post_enabled', true);

        if (pre_enabled) {
            pre_primary_approvers = JSON.parse(task.getInput('pre_primary_approvers', true));
            pre_secondary_approvers = JSON.parse(task.getInput('pre_secondary_approvers', true));
            pre_approval_timeout = parseInt(task.getInput('pre_approval_timeout', true));
        }
        
        if (post_enabled) {
            post_primary_approvers = JSON.parse(task.getInput('post_primary_approvers', true));
            post_secondary_approvers = JSON.parse(task.getInput('post_secondary_approvers', true));
            post_approval_timeout = parseInt(task.getInput('post_approval_timeout', true));
        }

        const smtp_host = task.getInput('smtp_host', true);
        const smtp_port = parseInt(task.getInput('smtp_port', true));
        const smtp_username = task.getInput('smtp_username', true);
        const smtp_password = task.getInput('smtp_password', true);
        const smtp_verbose = task.getBoolInput('smtp_verbose', true);
        const tool_name = task.getInput('tool_name', true);
        const tool_version = task.getInput('tool_version', true);
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
                releaseCreatorCanBeApprover: true,
                requiredApproverCount: 1
            };

            const preApprovalsArray = [];

            for (let i = 0; i < pre_primary_approvers.length; i++) {
                const pre_primary_approver = pre_primary_approvers[i];
                preApprovalsArray.push({
                    isAutomated: false,
                    approver: {
                        id: pre_primary_approver
                    },
                    isNotificationOn: false,
                    rank: 1
                });
            }
            for (let i = 0; i < pre_secondary_approvers.length; i++) {
                const pre_secondary_approver = pre_secondary_approvers[i];
                preApprovalsArray.push({
                    isAutomated: false,
                    approver: {
                        id: pre_secondary_approver
                    },
                    isNotificationOn: false,
                    rank: 1
                });
            }
            release.environments[indexOfInterest].preApprovalsSnapshot.approvals = preApprovalsArray;
        }
        
        if (post_enabled) {
            release.environments[indexOfInterest].postApprovalsSnapshot.approvalOptions = {
                timeoutInMinutes: post_approval_timeout,
                releaseCreatorCanBeApprover: true,
                requiredApproverCount: 1
            };

            const postApprovalsArray = [];

            for (let i = 0; i < post_primary_approvers.length; i++) {
                const post_primary_approver = post_primary_approvers[i];
                postApprovalsArray.push({
                    isAutomated: false,
                    approver: {
                        id: post_primary_approver
                    },
                    isNotificationOn: false,
                    rank: 1
                });
            }
            for (let i = 0; i < post_secondary_approvers.length; i++) {
                const post_secondary_approver = post_secondary_approvers[i];
                postApprovalsArray.push({
                    isAutomated: false,
                    approver: {
                        id: post_secondary_approver
                    },
                    isNotificationOn: false,
                    rank: 1
                });
            }
            release.environments[indexOfInterest].postApprovalsSnapshot.approvals = postApprovalsArray;
        }
        // console.log(`[i] Information to be updated: ${JSON.stringify(release)}`);
        console.log('[i] Update approvals: Started');
        // return secondApi.updateRelease(release, process.env.SYSTEM_TEAMPROJECT, release.id)
        return Promise.all([
            secondApi.updateRelease(release, process.env.SYSTEM_TEAMPROJECT, release.id),
            connection.getWorkItemTrackingApi()
        ]);
    }).then(results => {
        const [ release, api ] = results;

        // console.log(`[i] Updated release: ${JSON.stringify(release)}`);
        console.log(`[+] Update approvals: Complete`);
        console.log();
        console.log(`[i] Create work item: Started`);

        let indexOfInterest = 0;
        for (let i = 0; i < release.environments.length; i++) {
            const environment = release.environments[i];
            if (environment.name === process.env.RELEASE_ENVIRONMENTNAME) {
                indexOfInterest = ++i;
                break;
            }
        }

        const approvers = [];

        release.environments[indexOfInterest].preApprovalsSnapshot.approvals.forEach(approval => {
            approvers.push({
                info: approval.approver,
                type: 'Pre'
            });
        });

        release.environments[indexOfInterest].postApprovalsSnapshot.approvals.forEach(approval => {
            approvers.push({
                info: approval.approver,
                type: 'Post'
            });
        });

        return Promise.all([
            api.createWorkItem(null, [
                {
                    "op": "add",
                    "path": "/fields/System.Title",
                    "value": `${tool_name}, ${tool_version}`
                }, {
                    "op": "add",
                    "path": "/fields/Associated Context",
                    "value": `${tool_name}, ${tool_version}`
                }, {
                    "op": "replace",
                    "path": "/fields/System.AssignedTo",
                    "value": `${approvers[0].info.displayName} <${approvers[0].info.uniqueName}>`
                }
            ], process.env.SYSTEM_TEAMPROJECT, 'Code Review Request', false, false, false),
            approvers
        ]); 
    }).then(results => {
        const [ workItem, approvers ] = results;

        console.log(`[i] Work Item created: ${workItem}`);
        console.log(`[+] Create work item: Complete`);
        console.log();
        console.log(`[i] Send email: Started`);
        const transportOptions = {
            host: smtp_host,
            port: smtp_port,
            auth: {
                user: smtp_username,
                pass: smtp_password
            },
            secure: true,
            logger: false
        };

        if (smtp_verbose) {
            transportOptions.logger = true;
        }

        const server = mailer.createTransport(transportOptions);

        const email_promises = [];

        const approval_link = workItem._links.html.href;
        approvers.forEach(approver => {
            email_promises.push(server.sendMail({
                from: smtp_username,
                to: approver.info.uniqueName,
                subject: `Pending ${approver.type}-Approval for ${tool_name}, Version ${tool_version}`,
                html: `Dear ${approver.info.displayName},` + 
                    `<br/>` + 
                    `<br/>This email was sent to inform you that there is a pending ${approver.type.toLowerCase()}-approval from you for ${tool_name}, version ${tool_version}, which has been uploaded to an Azure DevOps Project you are involved in, ${process.env.SYSTEM_TEAMPROJECT}.` + 
                    `<br/>` + 
                    `<br/>Link to approve release: <a href="${approval_link}">${approval_link}</a>` + 
                    `<br/>` + 
                    `<br/>Thank you.` + 
                    `<br/>Harish Release Tools.`
            }));
        });

        return Promise.all(email_promises);
    }).then(() => {
        console.log(`[+] Send email: Complete`);
        console.log();
    }).then(() => {
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