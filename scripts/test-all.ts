import { blockchainUtils } from '../utils/blockchain-utils';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface TestResult {
    name: string;
    success: boolean;
    error?: string;
}

async function runAllTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    // Test Web3 Connection
    try {
        const web3 = blockchainUtils.getWeb3();
        const isConnected = await web3.eth.net.isListening();
        results.push({
            name: 'Web3 Connection',
            success: isConnected
        });
    } catch (error) {
        results.push({
            name: 'Web3 Connection',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }

    // Test Contract Connection
    try {
        const contract = blockchainUtils.getContract();
        const admin = await contract.methods.admin().call();
        results.push({
            name: 'Contract Connection',
            success: true
        });
    } catch (error) {
        results.push({
            name: 'Contract Connection',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }

    // Test MultiChain Connection
    try {
        if (blockchainUtils.multichain) {
            await new Promise((resolve, reject) => {
                blockchainUtils.multichain.getInfo((err: Error, info: any) => {
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

    return results;
}

if (require.main === module) {
    runAllTests()
        .then(results => {
            console.log('\nTest Results:');
            results.forEach(result => {
                console.log(`${result.success ? '✓' : '✗'} ${result.name}`);
                if (!result.success && result.error) {
                    console.log(`  Error: ${result.error}`);
                }
            });
            const allPassed = results.every(r => r.success);
            process.exit(allPassed ? 0 : 1);
        })
        .catch(error => {
            console.error('Test suite failed:', error);
            process.exit(1);
        });
}

export { runAllTests };
