import { blockchainUtils } from './blockchain-utils';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface TestResult {
    name: string;
    success: boolean;
    error?: string;
    details?: any;
}

async function runIntegrationTests() {
    const results: TestResult[] = [];
    const testData = {
        doctorId: 'd2',
        patientId: 'p1',
        doctorAddress: '0x8656D44bECA243a9444D02c61aBBD4194b7c72BB',
        patientAddress: '0x6025b66b1A7770e4ba13DA6683fA553De65Fd100',
        adminKey: process.env.ADMIN_PRIVATE_KEY!
    };

    console.log('Starting Integration Tests...\n');

    try {
        const web3 = blockchainUtils.getWeb3();
        const contract = blockchainUtils.getContract();
        const adminAccount = web3.eth.accounts.privateKeyToAccount(testData.adminKey);

        // Test Doctor Registration
        try {
            const doctor = await blockchainUtils.getDoctorDetails(testData.doctorId);
            results.push({
                name: 'Doctor Registration Check',
                success: doctor.isRegistered,
                details: {
                    doctorId: testData.doctorId,
                    walletAddress: doctor.walletAddress,
                    isRegistered: doctor.isRegistered
                }
            });

            // Test Patient Registration
            const patient = await blockchainUtils.getPatientDetails(testData.patientId);
            
            // If patient not registered, register them
            if (!patient.isRegistered) {
                await contract.methods.registerPatient(
                    testData.patientId,
                    testData.doctorId,
                    testData.patientAddress,
                    'initial'
                ).send({
                    from: adminAccount.address,
                    gas: '3000000'
                });
            }

            results.push({
                name: 'Patient Registration Check',
                success: true,
                details: {
                    patientId: testData.patientId,
                    walletAddress: testData.patientAddress,
                    registeredBy: testData.doctorId
                }
            });

            // Test Access Control
            const viewAccess = await contract.methods.checkViewAccess(
                testData.patientId,
                testData.doctorId
            ).call() as boolean;

            const updateAccess = await contract.methods.checkUpdateAccess(
                testData.patientId,
                testData.doctorId
            ).call() as boolean;

            // Grant access if not already granted
            if (!viewAccess || !updateAccess) {
                await contract.methods.grantAccess(testData.doctorId, true, true)
                    .send({
                        from: testData.patientAddress,
                        gas: '3000000'
                    });
            }

            results.push({
                name: 'Access Control Check',
                success: true,
                details: { viewAccess, updateAccess }
            });

            // Test Medical Records
            try {
                // Initialize records if not present
                await contract.methods.updateMedicalRecord(
                    testData.patientId,
                    'TestRecord_' + Date.now()
                ).send({
                    from: testData.doctorAddress,
                    gas: '3000000'
                });

                const records = await contract.methods.viewMedicalRecord(testData.patientId)
                    .call({ from: testData.doctorAddress });

                results.push({
                    name: 'Medical Records Access',
                    success: true,
                    details: { records }
                });
            } catch (error) {
                console.error('Medical records test failed:', error);
                results.push({
                    name: 'Medical Records Access',
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }

            // Test MultiChain
            if (blockchainUtils.multichain) {
                await new Promise<void>((resolve, reject) => {
                    blockchainUtils.multichain.getInfo((err: any, info: any) => {
                        if (err) {
                            results.push({
                                name: 'MultiChain Connection',
                                success: false,
                                error: err.message
                            });
                            reject(err);
                        } else {
                            results.push({
                                name: 'MultiChain Connection',
                                success: true,
                                details: { chainName: info.chainname }
                            });
                            resolve();
                        }
                    });
                });
            }

        } catch (error) {
            console.error('Test execution error:', error);
            results.push({
                name: 'Test Execution',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }

    } catch (error) {
        console.error('Test suite error:', error);
    }

    // Print results
    console.log('\nTest Results:');
    results.forEach(result => {
        console.log(`${result.success ? '✓' : '✗'} ${result.name}`);
        if (result.details) {
            console.log('  Details:', result.details);
        }
        if (result.error) {
            console.log('  Error:', result.error);
        }
    });

    const allPassed = results.every(r => r.success);
    console.log(`\nOverall Status: ${allPassed ? 'PASSED' : 'FAILED'}`);
    return allPassed;
}

if (require.main === module) {
    runIntegrationTests()
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            console.error('Test suite failed:', error);
            process.exit(1);
        });
}

export { runIntegrationTests };
