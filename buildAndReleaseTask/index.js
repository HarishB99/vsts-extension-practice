const task = require('vsts-task-lib/task');
const colors = require('colors');
const http = require('http');

colors.setTheme({
    info: 'cyan',
    success: 'green',
    warn: 'yellow',
    error: 'red'
});

try {
    console.log();
    console.log(colors.info('[i] Executing task: Started'));
    console.log();
    console.log(colors.info('[i] Storing input variables: Started'));
    let primary_approver = task.getInput('primary_approver', true);
    console.log(colors.info(`[i] primary_approver ${primary_approver}`));
    let secondary_approver = task.getInput('secondary_approver', true);
    console.log(colors.info(`[i] secondary_approver ${secondary_approver}`));
    let approval_timeout = task.getInput('approval_timeout', true);
    console.log(colors.info(`[i] approval_timeout ${approval_timeout}`));
    console.log(colors.success('[+] Storing input variables: Complete'));
    console.log();
    console.log(colors.info(`[i] Sending request to https://www.google.com/: Started`));
    http.get('https://www.google.com/', (response) => {
        console.log(colors.info(`[i] ${response.statusCode}`));
        console.log(colors.success('[+] Sending request to https://www.google.com/: Complete'));
    });
    console.log();
    console.log(colors.info('[+] Executing task: Completed'));
    console.log();
} catch (error) {
    console.log(colors.error('[-] Executing task: Failure'));
    console.log(`Reason: ${error}`);
}