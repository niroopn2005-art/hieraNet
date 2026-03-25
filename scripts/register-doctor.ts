import { blockchainUtils } from '../utils/blockchain-utils';
import Web3 from 'web3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface RegisterResult {
    success: boolean;
    transactionHash?: string;
    error?: string;
}

async function registerTestDoctor(): Promise<RegisterResult> {
    try {
        console.log('Executing doctor registration test...');
        
        // Initialize Web3 with provider
        const provider = new Web3.providers.HttpProvider(process.env.NEXT_PUBLIC_ETHEREUM_NODE_URL!);
        const web3 = new Web3(provider);
        const contract = blockchainUtils.getContract();

        // Get admin address from contract with proper typing
        const adminAddress = await contract.methods.admin().call() as string;
        console.log('Contract admin address:', adminAddress);

        // Get accounts
        const accounts = await web3.eth.getAccounts();
        console.log('Available accounts:', accounts);

        // Find admin account
        const adminAccount = accounts.find(acc => acc.toLowerCase() === adminAddress.toLowerCase());
        if (!adminAccount) {
            throw new Error('Admin account not found in available accounts');
        }

        // Test data using available accounts
        const testData = {
            doctorId: 'DOC003',
            walletAddress: accounts[3] // Using fourth account for new doctor
        };

        // Verify doctor doesn't exist
        const exists = await contract.methods.isDoctorRegistered(testData.doctorId).call();
        if (exists) {
            return {
                success: false,
                error: 'Doctor already registered'
            };
        }

        console.log('\nRegistering doctor with data:', testData);
        console.log('Using admin account:', adminAccount);

        // Register using admin account
        const result = await contract.methods
            .registerDoctor(testData.doctorId, testData.walletAddress)
            .send({
                from: adminAccount,
                gas: '3000000'
            });

        console.log('Doctor registration successful!');
        console.log('Transaction hash:', result.transactionHash);

        // Verify registration
        const isRegistered = await contract.methods.isDoctorRegistered(testData.doctorId).call();
        console.log('Registration verified:', isRegistered);

        return {
            success: true,
            transactionHash: result.transactionHash
        };

    } catch (error) {
        console.error('Error registering doctor:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

if (require.main === module) {
    registerTestDoctor()
        .then(result => {
            console.log('\nTest Results:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

export { registerTestDoctor };
