const task = require('vsts-task-lib/task');
const http = require('http');
const https = require('https');

try {
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
    console.log(`[i] Sending request to https://www.google.com/: Started`);
    https.get('https://www.google.com/', (response) => {
        console.log(`[i] ${response.statusCode}`);
        console.log('[+] Sending request to https://www.google.com/: Complete');
    });
    console.log();
    console.log('[+] Executing task: Completed');
    console.log();
} catch (error) {
    console.log();
    console.log('[-] Executing task: Failure');
    console.log(`Reason: ${error}`);
}