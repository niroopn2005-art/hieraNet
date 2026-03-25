import { blockchainUtils } from './blockchain-utils';
import dotenv from 'dotenv';
import path from 'path';

// Suppress deprecation warnings
process.removeAllListeners('warning');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface TestResult {
    name: string;
    success: boolean;
    error?: string;
    details?: any;
}

async function runSystemTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    console.log('Starting comprehensive system tests...\n');

    try {
        // 1. Test environment variables
        const envVars = [
            'NEXT_PUBLIC_ETHEREUM_NODE_URL',
            'NEXT_PUBLIC_CONTRACT_ADDRESS',
            'NEXT_PUBLIC_MULTICHAIN_PORT',
            'NEXT_PUBLIC_MULTICHAIN_HOST'
        ];

        const missingVars = envVars.filter(v => !process.env[v]);
        results.push({
            name: 'Environment Variables',
            success: missingVars.length === 0,
            error: missingVars.length ? `Missing: ${missingVars.join(', ')}` : undefined
        });

        // 2. Test Web3 Connection
        const web3 = blockchainUtils.getWeb3();
        const isConnected = await web3.eth.net.isListening();
        results.push({
            name: 'Web3 Connection',
            success: isConnected,
            details: { networkId: await web3.eth.net.getId() }
        });

        // 3. Test Contract Connection
        const contract = blockchainUtils.getContract();
        const admin = await contract.methods.admin().call();
        results.push({
            name: 'Smart Contract',
            success: true,
            details: { adminAddress: admin }
        });

        // 4. Test MultiChain Connection
        try {
            if (blockchainUtils.multichain) {
                await new Promise((resolve, reject) => {
                    blockchainUtils.multichain.getInfo((err: any, info: any) => {
                        if (err) reject(err);
                        else resolve(info);
                    });
                });
                results.push({
                    name: 'MultiChain Connection',
                    success: true
                });
            }
        } catch (error) {
            results.push({
                name: 'MultiChain Connection',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }

        // 5. Test Doctor Registration Status
        try {
            const isDoctorRegistered = await contract.methods.isDoctorRegistered('d2').call();
            results.push({
                name: 'Doctor Registration Check',
                success: true,
                details: { doctorId: 'd2', isRegistered: isDoctorRegistered }
            });
        } catch (error) {
            results.push({
                name: 'Doctor Registration Check',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }

        // 6. Test Patient Registration Status
        try {
            const isPatientRegistered = await contract.methods.isPatientRegistered('p1').call();
            results.push({
                name: 'Patient Registration Check',
                success: true,
                details: { patientId: 'p1', isRegistered: isPatientRegistered }
            });
        } catch (error) {
            results.push({
                name: 'Patient Registration Check',
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }

    } catch (error) {
        console.error('Test suite error:', error);
    }

    return results;
}

// Run if called directly
if (require.main === module) {
    runSystemTests().then(results => {
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
        process.exit(allPassed ? 0 : 1);
    });
}

export { runSystemTests };
