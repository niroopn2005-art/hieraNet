import { blockchainUtils } from '../utils/blockchain-utils';
import dotenv from 'dotenv';
import path from 'path';

// Suppress deprecation warnings
process.removeAllListeners('warning');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runSystemTest() {
    console.log('Starting comprehensive system test...\n');

    try {
        // 1. Test environment variables
        console.log('1. Checking environment variables:');
        const requiredVars = [
            'NEXT_PUBLIC_ETHEREUM_NODE_URL',
            'NEXT_PUBLIC_CONTRACT_ADDRESS'
        ];
        
        const missingVars = requiredVars.filter(v => !process.env[v]);
        if (missingVars.length) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }
        console.log('✓ Environment variables OK');

        // 2. Test blockchain connection
        const web3 = blockchainUtils.getWeb3();
        console.log('\n2. Testing blockchain connection:');
        const isConnected = await web3.eth.net.isListening();
        if (!isConnected) throw new Error('Not connected to blockchain');
        console.log('✓ Blockchain connection OK');

        // 3. Test contract connection
        console.log('\n3. Testing contract:');
        const contract = blockchainUtils.getContract();
        const admin = await contract.methods.admin().call();
        console.log('✓ Contract connection OK');
        console.log('Admin address:', admin);

        return true;
    } catch (error) {
        console.error('System test failed:', error);
        return false;
    }
}

// Execute if run directly
if (require.main === module) {
    runSystemTest()
        .then(success => {
            console.log('\nOverall System Test:', success ? 'PASSED' : 'FAILED');
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('\nTest failed with error:', error);
            process.exit(1);
        });
}
