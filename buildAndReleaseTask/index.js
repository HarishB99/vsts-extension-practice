const task = require('vsts-task-lib/task');
const http = require('http');
// const https = require('https');
const https = require('follow-redirects').https;
const request = require('request');
const vsts = require('azure-devops-node-api/CoreApi');
const release = require('azure-devops-node-api/ReleaseApi').ReleaseApi;

try {
    // new vsts.CoreApi().rest
    console.log();
    console.log('[i] Executing task: Started');
    console.log();
    console.log('[i] Storing input variables: Started');
    let primary_approver = task.getInput('primary_approver', true);
    console.log(`[i] primary_approver ${primary_approver}`);
    let secondary_approver = task.getInput('secondary_approver', true);
    console.log(`[i] secondary_approver ${secondary_approver}`);
    let approval_timeout = task.getInput('approval_timeout', true);
    console.log(`[i] approval_timeout ${approval_timeout}`);
    console.log('[+] Storing input variables: Complete');
    console.log();
    console.log('[i] Printing out process variables: Started');
    console.log();
    console.log(process.env);
    console.log();
    console.log('[+] Printing out process variables: Completed');
    console.log();
    // const url = process.env.ENDPOINT_URL_SYSTEMVSSCONNECTION.concat(process.env.BUILD_PROJECTNAME).concat('/_apis/Release/definitions');
    // console.log(`[i] Sending request to ${url}: Started`);
    // https.get(`${process.env.ENDPOINT_URL_SYSTEMVSSCONNECTION}${process.env.BUILD_PROJECTNAME}/_apis/Release/defintions`, (response) => {
    //     console.log(`[i] ${response.statusCode}`);
    //     console.log('[+] Sending request: Complete');
    //     console.log();
    //     console.log('[+] Executing task: Completed');
    // });
    // request.post(url, {
    //     followAllRedirects: true
    // })
    // .on('response', response => {
    //     console.log('[i] statusCode: ', response.statusCode);
    //     console.log('[i] headers: ', response.headers);
        
    //     response.on('data', (d) => {
    //         process.stdout.write(d);
    //     });
    //     console.log(`[+] Sending request to ${url}: Complete`);
    //     console.log();
    //     console.log('[+] Executing task: Completed');
    // }).on('error', (e) => {
    //     console.log(`[-] Sending request to ${url}: Failure`);
    //     console.error(`Reason: ${e}`);
    // });
    console.log('[i] Attempting to get release definitions: Started');
    new release(process.env.SYSTEM_TEAMFOUNDATIONSERVERURI).getReleaseDefinitions(process.env.BUILD_PROJECTNAME)
    .then(definitions => {
        console.log();
        console.log(`definitions: ${definitions}`);
        console.log();
    })
    .then(() => {
        return console.log('[+] Attempting to get release definitions: Completed');
    })
    .catch(error => {
        console.error('[-] Attempting to get release definitions: Failure');
        console.error(`Reason: ${error}`);
    });
    console.log();
    console.log('[i] Attempting to get releases: Started');
    new release(process.env.SYSTEM_TEAMFOUNDATIONSERVERURI).getReleases(process.env.BUILD_PROJECTNAME)
    .then(releases => {
        console.log();
        console.log(`releases: ${releases}`);
        console.log();
    })
    .then(() => {
        return console.log('[+] Attempting to get releases: Completed');
    })
    .catch(error => {
        console.error('[-] Attempting to get releases: Failure');
        console.error(`Reason: ${error}`);
    });
    // https.get(url, (response) => {
    //     console.log('[i] statusCode: ', response.statusCode);
    //     console.log('[i] headers: ', response.headers);
        
    //     response.on('data', (d) => {
    //         process.stdout.write(d);
    //     });
    //     console.log(`[+] Sending request to ${url}: Complete`);
    //     console.log();
    //     console.log('[+] Executing task: Completed');
    // }).on('error', (e) => {
    //     console.log(`[-] Sending request to ${url}: Failure`);
    //     console.error(`Reason: ${e}`);
    // });
    console.log();
} catch (error) {
    console.log();
    console.log('[-] Executing task: Failure');
    console.log(`Reason: ${error}`);
}