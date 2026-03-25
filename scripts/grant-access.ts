import { blockchainUtils } from '../utils/blockchain-utils';
import dotenv from 'dotenv';
import path from 'path';
import Web3 from 'web3';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface GrantAccessResult {
    success: boolean;
    transactionHash?: string;
    error?: string;
}

async function grantAccess(): Promise<GrantAccessResult> {
    try {
        console.log('Starting access grant process...');
        const web3 = new Web3(process.env.NEXT_PUBLIC_ETHEREUM_NODE_URL!);
        const contract = blockchainUtils.getContract();

        // Use test data
        const testData = {
            patientId: 'PAT1747235677895',
            doctorId: 'DOC001',
            patientAccount: '0x9D60A8b035be581f4E09710906B0Efae9307D7CE' // Using the patient's address
        };

        console.log('\nGranting access with data:', testData);

        // Check if patient exists
        const patientExists = await contract.methods.isPatientRegistered(testData.patientId).call();
        if (!patientExists) {
            throw new Error('Patient not registered');
        }

        // Check if doctor exists
        const doctorExists = await contract.methods.isDoctorRegistered(testData.doctorId).call();
        if (!doctorExists) {
            throw new Error('Doctor not registered');
        }

        // Grant both view and update access
        const result = await contract.methods.grantAccess(
            testData.doctorId,
            true,  // View access
            true   // Update access
        ).send({
            from: testData.patientAccount,
            gas: '3000000'
        });

        console.log('\nAccess granted successfully!');
        console.log('Transaction hash:', result.transactionHash);

        // Verify access was granted
        const hasViewAccess = await contract.methods.checkViewAccess(
            testData.patientId,
            testData.doctorId
        ).call();

        const hasUpdateAccess = await contract.methods.checkUpdateAccess(
            testData.patientId,
            testData.doctorId
        ).call();

        console.log('\nAccess verification:');
        console.log('View access:', hasViewAccess ? 'Granted' : 'Not granted');
        console.log('Update access:', hasUpdateAccess ? 'Granted' : 'Not granted');

        return {
            success: true,
            transactionHash: result.transactionHash
        };
    } catch (error) {
        console.error('Error granting access:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

interface GrantResult {
    success: boolean;
    transactionHash?: string;
    error?: string;
}

async function grantDoctorAccess(): Promise<GrantResult> {
    try {
        console.log('Starting access grant process...');
        
        const web3 = new Web3(process.env.NEXT_PUBLIC_ETHEREUM_NODE_URL!);
        const contract = blockchainUtils.getContract();

        const testData = {
            doctorId: 'DOC003',
            patientId: 'PAT1747235677895',
            patientAddress: '0x9D60A8b035be581f4E09710906B0Efae9307D7CE' // Patient's address
        };

        console.log('\nGranting access with data:', testData);

        // Grant both view and update access
        const result = await contract.methods
            .grantAccess(testData.doctorId, true, true)
            .send({
                from: testData.patientAddress,
                gas: '3000000'
            });

        // Verify access was granted
        const hasViewAccess = await contract.methods
            .checkViewAccess(testData.patientId, testData.doctorId)
            .call();
        
        const hasUpdateAccess = await contract.methods
            .checkUpdateAccess(testData.patientId, testData.doctorId)
            .call();

        console.log('\nAccess verification:');
        console.log('View access:', hasViewAccess ? 'Granted' : 'Not granted');
        console.log('Update access:', hasUpdateAccess ? 'Granted' : 'Not granted');

        return {
            success: true,
            transactionHash: result.transactionHash
        };

    } catch (error) {
        console.error('Error granting access:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

if (require.main === module) {
    grantDoctorAccess()
        .then(result => {
            console.log('\nAccess Grant Results:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Failed to grant access:', error);
            process.exit(1);
        });
}

export { grantAccess, grantDoctorAccess };
