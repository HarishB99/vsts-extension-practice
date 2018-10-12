const task = require('vsts-task-lib/task');
const azure_devops_api = require('azure-devops-node-api');
const mailer = require('nodemailer');
// Regex for both URL and IP
// ^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?|^((http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$

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
        console.log(`[i] smtp_host = ${smtp_host}, type: ${typeof smtp_host}`);
        const smtp_port = parseInt(task.getInput('smtp_port', true));
        console.log(`[i] smtp_port = ${smtp_port}, type: ${typeof smtp_port}`);
        const smtp_username = task.getInput('smtp_username', true);
        console.log(`[i] smtp_username = ${smtp_username}, type: ${typeof smtp_username}`);
        const smtp_password = task.getInput('smtp_password', true);
        console.log(`[i] typeof smtp_password: ${typeof smtp_password}, ${smtp_password}`);
        const tool_name = task.getInput('tool_name', true);
        console.log(`[i] tool_name = ${tool_name}, type: ${typeof tool_name}`);
        const tool_version = task.getInput('tool_version', true);
        console.log(`[i] tool_version = ${tool_version}, type: ${typeof tool_version}`);
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
                releaseCreatorCanBeApprover: true,
                requiredApproverCount: 1
            };

            const preApprovalsArray = [];

            for (let i = 0; i < pre_primary_approvers.length; i++) {
                const pre_primary_approver = pre_primary_approvers[i];
                // let currentIndex = i;
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
                // let currentIndex = i;
                // let currentRank = currentIndex + 1 + preApprovalsArray[preApprovalsArray.length - 1].rank;
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
                // let currentIndex = i;
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
                // let currentIndex = i;
                // let currentRank = currentIndex + 1 + postApprovalsArray[postApprovalsArray.length - 1].rank;
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
        console.log(`[i] Information to be updated: ${JSON.stringify(release)}`);
        console.log('[i] Update approvals: Started');
        return secondApi.updateRelease(release, process.env.SYSTEM_TEAMPROJECT, release.id)
    }).then(release => {
        console.log();
        console.log(`Updated release: ${JSON.stringify(release)}`);
        console.log();
        console.log(`[+] Update approvals: Complete`);
        console.log();
        console.log(`[i] Send email: Started`);
        const server = mailer.createTransport({
            host: smtp_host,
            port: smtp_port,
            auth: {
                user: smtp_username,
                pass: smtp_password
            },
            secure: true,
            logger: true
        });

        const recipients = [];

        let indexOfInterest = 0;
        for (let i = 0; i < release.environments.length; i++) {
            const environment = release.environments[i];
            if (environment.name === process.env.RELEASE_ENVIRONMENTNAME) {
                indexOfInterest = ++i;
                break;
            }
        }

        release.environments[indexOfInterest].preApprovalsSnapshot.approvals.forEach(approval => {
            recipients.push({'email': approval.approver.uniqueName, 'name': approval.approver.displayName, 'type': 'Pre'});
        });

        release.environments[indexOfInterest].postApprovalsSnapshot.approvals.forEach(approval => {
            recipients.push({'email': approval.approver.uniqueName, 'name': approval.approver.displayName, 'type': 'Post'});
        });

        const emails_sent = [];

        const approval_link = `${process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI}${process.env.SYSTEM_TEAMPROJECT}/_apps/hub/HarishB.harish-release-task-page.harish-approval-release-hub`;

        recipients.forEach(recipient => {
            emails_sent.push(server.sendMail({
                from: smtp_username,
                to: recipient.email,
                subject: `Pending ${recipient.type}-Approval for ${tool_name}, Version ${tool_version}`,
                html: `Dear ${recipient.name},` + 
                    `<br/>` + 
                    `<br/>This email was sent to inform you that there is a pending ${recipient.type.toLowerCase()}-approval from you for ${tool_name}, version ${tool_version}, which has been uploaded to an Azure DevOps Project you are involved in, ${process.env.SYSTEM_TEAMPROJECT}.` + 
                    `<br/>` + 
                    `<br/>Link to approve release: <a href="${approval_link}">${approval_link}</a>` + 
                    `<br/>` + 
                    `<br/>Thank you.` + 
                    `<br/>Harish Release Tools.`
            }));
        });

        return Promise.all(emails_sent);
    }).then(() => {
        console.log();
        console.log(`[+] Send email: Complete`);
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