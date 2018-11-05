const task = require('vsts-task-lib/task');
const azure_devops_api = require('azure-devops-node-api');
const mailer = require('nodemailer');

try {
    console.log();
    console.log('[i] Executing task: Started');
    console.log();
    console.log('[i] Storing input variables: Started');

    const team_foundation_server_uri = task.getVariable('system.teamfoundationserveruri');
    const team_project_name = task.getVariable('system.teamproject');
    const build_id = task.getVariable('build.buildid');
    const release_id = task.getVariable('release.releaseid');
    const release_environment_name = task.getVariable('release.environmentname');

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
        const smtp_enabled = task.getBoolInput('smtp_enabled', true);

        const work_item_stakeholder = JSON.parse(task.getInput('work_item_stakeholder', true));
    console.log('[+] Storing input variables: Complete');
    console.log();
    const authHandler = azure_devops_api.getBearerHandler(
        task.getEndpointAuthorizationParameter('SystemVssConnection', 'AccessToken', false));
    const connection = new azure_devops_api.WebApi(team_foundation_server_uri, authHandler);
    connection.getReleaseApi().then(api => {
        console.log(`[i] Retrieve release info: Started`);
        return Promise.all([
            api.getRelease(team_project_name, parseInt(release_id)),
            connection.getReleaseApi()
        ]);
    }).then(results => {
        console.log(`[+] Retrieve release info: Complete`);
        console.log();

        const [ release, secondApi ] = results;
        
        let indexOfInterest = 0;
        for (let i = 0; i < release.environments.length; i++) {
            const environment = release.environments[i];
            if (environment.name === release_environment_name) {
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
        console.log('[i] Update approvals using release info retrieved: Started');
        // return secondApi.updateRelease(release, team_project_name, release.id)
        return Promise.all([
            secondApi.updateRelease(release, team_project_name, release.id),
            connection.getBuildApi()
        ]);
    }).then(results => {
        const [ release, api ] = results;
        
        // console.log(`[i] Updated release: ${JSON.stringify(release)}`);
        console.log(`[+] Update approvals using release info retrieved: Complete`);
        console.log();
        console.log(`[i] Create work item: Started`);

        let indexOfInterest = 0;
        for (let i = 0; i < release.environments.length; i++) {
            const environment = release.environments[i];
            if (environment.name === release_environment_name) {
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

        const work_item_info = {
            owner_info: {
                displayName: '',
                uniqueName: ''
            },
            associated_context: {
                release_id: '',
                indexOfInterest: 0,
                attachments: []
            }
        };

        approvers.forEach(approver => {
            if (approver.info.id === work_item_stakeholder[0]) {
                work_item_info.owner_info.displayName = approver.info.displayName;
                work_item_info.owner_info.uniqueName = approver.info.uniqueName;
            }
        });

        work_item_info.associated_context.release_id = release.id;
        work_item_info.associated_context.indexOfInterest = indexOfInterest;

        return Promise.all([
            work_item_info,
            approvers,
            api.getArtifacts(build_id, team_project_name),
            connection.getBuildApi()
        ]);
    }).then(results => {
        const [ work_item_info, approvers, artifacts, api ] = results;

        const promise_values = [
            work_item_info,
            approvers,
            artifacts,
            connection.getWorkItemTrackingApi()
        ];

        artifacts.forEach(artifact => {
            promise_values.push(api.getArtifactContentZip(build_id, artifact.name, team_project_name));
        });
        
        return Promise.all(promise_values);
    }).then(results => {
        const work_item_info = results[0];
        const approvers = results[1];
        const artifacts = results[2];
        const work_item_tracking_api = results[3];
        const artifact_zips = [];
        
        for (let i = 4; i < results.length; i++) {
            artifact_zips.push(results[i]);
        }

        const promise_values = [
            work_item_info,
            approvers,
            connection.getWorkItemTrackingApi()
        ];
        
        artifacts.forEach((artifact, i) => {
            promise_values.push(work_item_tracking_api.createAttachment(null, artifact_zips[i], `${artifact.name}.zip`));
        });
        
        return Promise.all(promise_values);
    }).then(results => {
        const work_item_info = results[0];
        const approvers = results[1];
        const api = results[2];

        const attachments = [];
        
        for (let i = 3; i < results.length; i++) {
            attachments.push(results[i]);
            work_item_info.associated_context.attachments.push(results[i]);
        }

        // console.log(`work_item_info: ${JSON.stringify(work_item_info)}`);
        const associated_context = JSON.stringify(work_item_info.associated_context);
        const work_item_stakeholder_info = work_item_info.owner_info;
        // console.log(`associated_context: ${associated_context}`);

        const pre_work_item_ops = [
            {
                "op": "add",
                "path": "/fields/System.Title",
                "value": `Pre-Approval for ${tool_name}, ${tool_version}`
            }, {
                "op": "add",
                "path": "/fields/Associated Context",
                "value": associated_context
            }, {
                "op": "replace",
                "path": "/fields/System.AssignedTo",
                "value": `${work_item_stakeholder_info.displayName} <${work_item_stakeholder_info.uniqueName}>`
            }
        ];
        const post_work_item_ops = [
            {
                "op": "add",
                "path": "/fields/System.Title",
                "value": `Post-Approval for ${tool_name}, ${tool_version}`
            }, {
                "op": "add",
                "path": "/fields/Associated Context",
                "value": associated_context
            }, {
                "op": "replace",
                "path": "/fields/System.AssignedTo",
                "value": `${work_item_stakeholder_info.displayName} <${work_item_stakeholder_info.uniqueName}>`
            }
        ];

        attachments.forEach(attachment => {
            const op = {
                "op": "add",
                "path": "/relations/-",
                "value": {
                    "rel": "AttachedFile",
                    "url": attachment.url,
                    "attributes": {
                        "comment": `Attachment Id: ${attachment.id}`
                    }
                }
            };
            pre_work_item_ops.push(op);
            post_work_item_ops.push(op);
        });

        return Promise.all([
            api.createWorkItem(
                null, pre_work_item_ops, team_project_name, 'Feature', false, false, false),
            api.createWorkItem(
                null, post_work_item_ops, team_project_name, 'Feature', false, false, false),
            approvers
        ]); 
    }).then(results => {
        const [ preWorkItem, postWorkItem, approvers ] = results;

        // console.log(`[i] Pre Work Item created: ${JSON.stringify(preWorkItem)}`);
        // console.log(`[i] Post Work Item created: ${JSON.stringify(postWorkItem)}`);
        console.log(`[+] Create work item: Complete`);
        console.log();
        console.log(`[i] Send email: Started`);
        if (smtp_enabled) {
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
    
            const pre_approval_link = preWorkItem._links.html.href;
            const post_approval_link = postWorkItem._links.html.href;
            approvers.forEach(approver => {
                const approval_link = (approver.type === 'Pre') ? pre_approval_link : post_approval_link;
                email_promises.push(server.sendMail({
                    from: smtp_username,
                    to: approver.info.uniqueName,
                    subject: `Pending ${approver.type}-Approval for ${tool_name}, Version ${tool_version}`,
                    html: `Dear ${approver.info.displayName},` + 
                        `<br/>` + 
                        `<br/>This email was sent to inform you that there is a pending ${approver.type.toLowerCase()}-approval from you for ${tool_name}, version ${tool_version}, which has been uploaded to an Azure DevOps Project you are involved in, ${team_project_name}.` + 
                        `<br/>` + 
                        `<br/>Link to approve release: <a href="${approval_link}">${approval_link}</a>` + 
                        `<br/>` + 
                        `<br/>Thank you.` + 
                        `<br/>Harish Release Tools.`
                }));
            });
    
            return Promise.all(email_promises);
        } else {
            console.log('[i] Emails will not be sent as email feature has been disabled by user.');
            return console.log('[i] Skipping this feature...');
        }
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