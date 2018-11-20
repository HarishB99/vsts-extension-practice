const task = require('azure-pipelines-task-lib/task');
const azure_devops_api = require('azure-devops-node-api');
const mailer = require('nodemailer');

try {
    console.log();
    console.log('[i] Executing task: Started');
    console.log();
    console.log('[i] Initialising task: Started');
        // Retrieve relevant environment variables using the VSTS task library
        const team_foundation_server_uri = task.getVariable('system.teamfoundationserveruri');
        const team_project_name = task.getVariable('system.teamproject');
        const build_id = task.getVariable('build.buildid');
        const release_id = task.getVariable('release.releaseid');
        const release_environment_name = task.getVariable('release.environmentname');

        // Retrieve user inputs
        let pre_primary_approvers = null;
        let pre_secondary_approvers = null;
        let pre_approval_timeout = null;

        let post_primary_approvers = null;
        let post_secondary_approvers = null;
        let post_approval_timeout = null;

        let smtp_host = null;
        let smtp_port = null;
        let smtp_username = null;
        let smtp_password = null;
        let smtp_verbose = null;
        
        const pre_enabled = task.getBoolInput('pre_enabled', true);
        const post_enabled = task.getBoolInput('post_enabled', true);
        const smtp_enabled = task.getBoolInput('smtp_enabled', true);

        // If pre-deployment approval is enabled, 
        // retrieve all user inputs related for this operation.
        if (pre_enabled) {
            pre_primary_approvers = JSON.parse(task.getInput('pre_primary_approvers', true));
            pre_secondary_approvers = JSON.parse(task.getInput('pre_secondary_approvers', true));
            pre_approval_timeout = parseInt(task.getInput('pre_approval_timeout', true));
        }
        
        // If post-deployment approval is enabled, 
        // retrieve all user inputs related for this operation.
        if (post_enabled) {
            post_primary_approvers = JSON.parse(task.getInput('post_primary_approvers', true));
            post_secondary_approvers = JSON.parse(task.getInput('post_secondary_approvers', true));
            post_approval_timeout = parseInt(task.getInput('post_approval_timeout', true));
        }
        
        // If SMTP option is enabled, 
        // retrieve all user inputs related for this operation.
        if (smtp_enabled) {
            smtp_host = task.getInput('smtp_host', true);
            smtp_port = parseInt(task.getInput('smtp_port', true));
            smtp_username = task.getInput('smtp_username', true);
            smtp_password = task.getInput('smtp_password', true);
            smtp_verbose = task.getBoolInput('smtp_verbose', true);
        }

        // Retrieve the work item "stakeholder"
        // i.e. the user to whom the work items created 
        //      will be assigned to 
        const work_item_stakeholder = JSON.parse(task.getInput('work_item_stakeholder', true))[0];
        console.log(`work_item_stakeholder: ${work_item_stakeholder}`);
        // Retrieve tool name and version, as configured by user
        const tool_name = task.getInput('tool_name', true);
        const tool_version = task.getInput('tool_version', true);
    console.log('[+] Initialising task: Complete');
    console.log();



    // With the help of Azure DevOps node api, get the 
    // authentication handler that will be used for the connection
    // between this node js client and the Azure DevOps REST endpoints.
    //
    // This is necessary for this node js release task to communicate 
    // with the relevant REST APIs later.
    const authHandler = azure_devops_api.getBearerHandler(
        task.getEndpointAuthorizationParameter('SystemVssConnection', 'AccessToken', false));
    const connection = new azure_devops_api.WebApi(team_foundation_server_uri, authHandler);

    // With the connection created, we are ready to 
    // start the task and communicate with the REST APIs.
    connection.getReleaseApi().then(release_api => {
        console.log(`[i] Retrieve release info to be updated: Started`);
        return Promise.all([
            release_api.getRelease(team_project_name, parseInt(release_id)),
            connection.getReleaseApi()
        ]);
    }).then(results => {
        console.log(`[+] Retrieve release info to be updated: Complete`);
        console.log();

        const [ release, release_api ] = results;
        
        // index_of_interest keeps track of the 
        // release stage for which the release task 
        // will be configure the approvals
        //
        // i.e. The next Stage
        // e.g. If you are running this task in Stage 1,
        //      the task itself will configure approvals 
        //      for Stage 2.
        let index_of_interest = 0;
        for (let i = 0; i < release.environments.length; i++) {
            const environment = release.environments[i];
            if (environment.name === release_environment_name) {
                index_of_interest = ++i;
                break;
            }
        }
        
        // If pre-deployment approval is enabled, 
        // configure pre-deployment approvals.
        if (pre_enabled) {
            release.environments[index_of_interest].preApprovalsSnapshot.approvalOptions = {
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
            release.environments[index_of_interest].preApprovalsSnapshot.approvals = preApprovalsArray;
        }
        
        // If post-deployment approval is enabled, 
        // configure post-deployment approvals.
        if (post_enabled) {
            release.environments[index_of_interest].postApprovalsSnapshot.approvalOptions = {
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
            release.environments[index_of_interest].postApprovalsSnapshot.approvals = postApprovalsArray;
        }

        // The release object has been configured.
        // Now it is time to send this configured object to the api 
        // to publish the changes.
        console.log('[i] Update approvals using release info retrieved: Started');
        return Promise.all([
            release_api.updateRelease(release, team_project_name, release.id),
            connection.getBuildApi()
        ]);
    }).then(results => {
        const [ updated_release, build_api ] = results;
        console.log(`[+] Update approvals using release info retrieved: Complete`);
        console.log();

        // Once again, index_of_interest keeps track of the 
        // release stage for which the release task 
        // will be configure the approvals
        //
        // i.e. The next Stage
        // e.g. If you are running this task in Stage 1,
        //      the task itself will configure approvals 
        //      for Stage 2.
        let index_of_interest = 0;
        for (let i = 0; i < updated_release.environments.length; i++) {
            const environment = updated_release.environments[i];
            if (environment.name === release_environment_name) {
                index_of_interest = ++i;
                break;
            }
        }

        // This array will hold the information 
        // of each approvers necessary to send 
        // out the emails later, if SMTP (email)
        // option has been enabled.
        const approvers = [];

        // Information needed to create and store in 
        // the work items later.
        const work_item_info = {
            owner_info: {
                displayName: '',
                uniqueName: ''
            },
            user_info: {
                displayName: '',
                uniqueName: ''
            },
            release_id: '',
            indexOfInterest: 0
        };

        updated_release.environments[index_of_interest].preApprovalsSnapshot.approvals.forEach(approval => {
            if (approval.approver.id === pre_primary_approvers[0]) {
                work_item_info.owner_info.displayName = approval.approver.displayName;
                work_item_info.owner_info.uniqueName = approval.approver.uniqueName;
            }
            approvers.push({
                info: approval.approver,
                type: 'Pre'
            });
        });

        updated_release.environments[index_of_interest].postApprovalsSnapshot.approvals.forEach(approval => {
            if (approval.approver.id === post_primary_approvers[0]) {
                work_item_info.user_info.displayName = approval.approver.displayName;
                work_item_info.user_info.uniqueName = approval.approver.uniqueName;
            }
            approvers.push({
                info: approval.approver,
                type: 'Post'
            });
        });

        work_item_info.release_id = updated_release.id;
        work_item_info.indexOfInterest = index_of_interest;

        return Promise.all([
            work_item_info,
            approvers,
            build_api.getArtifacts(build_id, team_project_name),
            connection.getBuildApi()
        ]);
    }).then(results => {
        const [ work_item_info, approvers, artifacts, build_api ] = results;

        const promise_values = [
            work_item_info,
            approvers,
            artifacts,
            connection.getWorkItemTrackingApi()
        ];

        artifacts.forEach(artifact => {
            promise_values.push(build_api.getArtifactContentZip(build_id, artifact.name, team_project_name));
        });
        
        return Promise.all(promise_values);
    }).then(results => {
        const [ work_item_info, approvers, artifacts, work_item_tracking_api, ...artifact_zips ] = results;

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
        const [ work_item_info, approvers, work_item_tracking_api, ...attachments ] = results;

        const work_item_stakeholder_info = work_item_info.owner_info;
        
        const work_item_ops = [
            {
                "op": "add",
                "path": "/fields/System.Title",
                "value": `Approval for ${tool_name}, ${tool_version}`
            }, {
                "op": "add",
                "path": "/fields/Associated Context",
                "value": JSON.stringify(work_item_info)
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
            work_item_ops.push(op);
        });

        console.log(`[i] Create work items: Started`);
        return Promise.all([
            work_item_tracking_api.createWorkItem(
                null, work_item_ops, team_project_name, 'Feature', false, true, false),
            approvers
        ]); 
    }).then(results => {
        const [ work_item, approvers ] = results;

        console.log(`[+] Create work items: Complete`);
        console.log();
        console.log(`[i] Send emails: Started`);
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
    
            const approval_link = work_item._links.html.href;
            approvers.forEach(approver => {
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
        console.log(`[+] Send emails: Complete`);
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