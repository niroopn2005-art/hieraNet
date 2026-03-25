import { blockchainUtils } from '../utils/blockchain-utils';
import dotenv from 'dotenv';
import path from 'path';
import Web3 from 'web3';

// Suppress deprecation warnings
process.removeAllListeners('warning');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface PatientData {
    patientId: string;
    walletAddress: string;
    privateCID: string;
    publicCID: string;
}

async function registerTestPatient() {
    try {
        console.log('Starting patient registration script...');
        
        const web3 = new Web3(process.env.NEXT_PUBLIC_ETHEREUM_NODE_URL!);
        const contract = blockchainUtils.getContract();
        
        // Get accounts and doctor
        const accounts = await web3.eth.getAccounts();
        const doctorId = 'DOC001';
        const doctorAddress = await contract.methods.doctors(doctorId).call().then((doc: any) => doc.walletAddress);

        // Find an available account that isn't already registered
        let availableAccount = null;
        for (let i = 3; i < accounts.length; i++) {
            const isRegistered = await contract.methods.walletToPatientId(accounts[i]).call();
            if (!isRegistered) {
                availableAccount = accounts[i];
                break;
            }
        }

        if (!availableAccount) {
            throw new Error('No available unregistered accounts found');
        }

        const testData = {
            patientId: `PAT${Date.now()}`, // Generate unique ID
            walletAddress: availableAccount,
            privateCID: 'QmTestPrivateCID123',
            publicCID: 'QmTestPublicCID123'
        };

        console.log('\nRegistering patient:', testData);
        console.log('Using doctor address:', doctorAddress);

        // Check if patient ID exists
        const exists = await contract.methods.isPatientRegistered(testData.patientId).call();
        if (exists) {
            throw new Error('Patient ID already registered');
        }

        const result = await blockchainUtils.handleCIDUpload(
            testData.patientId,
            doctorId,
            testData.walletAddress,
            testData.privateCID,
            testData.publicCID,
            doctorAddress
        );

        console.log('\nPatient registration successful!');
        console.log('Transaction hash:', result.ethTransaction);

        // Verify registration
        const isRegistered = await contract.methods.isPatientRegistered(testData.patientId).call();
        console.log('Registration verified:', isRegistered);

        return result;
    } catch (error) {
        if (error instanceof Error && error.message.includes('already registered')) {
            console.log('Warning: Address or ID already registered');
        } else {
            console.error('Error registering patient:', error);
        }
        throw error;
    }
}

if (require.main === module) {
    registerTestPatient()
        .then(result => {
            console.log('\nTest completed:', result.success ? 'SUCCESS' : 'FAILED');
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('\nTest failed:', error);
            process.exit(1);
        });
}

export { registerTestPatient };
