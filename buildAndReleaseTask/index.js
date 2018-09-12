console.log('[i] Communicating with VSTS REST endpoint: Started');
console.log(process.env);
console.log('[+] Communicating with VSTS REST endpoint: Complete');

console.log('[i] Printing out process arguments: Started');
console.log();
process.argv.forEach((value, index) => {
    console.log(`${index}: ${value}`);
});
console.log();
console.log('[+] Printing out process arguments: Complete');
console.log();

console.log('[i] Printing out process environments: Started');
// console.log(process.env);
console.log(`samplestring: ${process.env.INPUT_SAMPLESTRING}`);
console.log('[+] Printing out process environments: Complete');
console.log();

console.log('[i] Performing arbitrary code execution: Started');
let num = 1;
num++;
console.log(`num = ${num}`);
console.log(`typeof num = ${typeof num}`);
console.log('[+] Performing arbitrary code execution: Complete');
console.log();

console.log('[i] Setting process variable, testvar: Started');
console.log('##vso[task.setvariable variable=testvar;]testvalue');
console.log('[+] Setting process variable, testvar: Complete');
console.log();

console.log('[i] Printing out final test message: Started');
console.log('[i] My name is Optimus Prime. This is a test message for build and release tasks.');
console.log('[+] Printing out final test message: Complete');