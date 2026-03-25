import { blockchainUtils } from '../utils/blockchain-utils';
import dotenv from 'dotenv';
import path from 'path';
import Web3 from 'web3';

interface UpdateResult {
    success: boolean;
    transactionHash?: string;
    error?: string;
    newPrivateCID?: string;
    newPublicCID?: string;
}

async function updatePatientRecords(): Promise<UpdateResult> {
    try {
        console.log('Starting record update process...');
        
        const provider = new Web3.providers.HttpProvider(process.env.NEXT_PUBLIC_ETHEREUM_NODE_URL!);
        const web3 = new Web3(provider);
        const contract = blockchainUtils.getContract();

        const testData = {
            doctorId: 'DOC003',
            patientId: 'PAT1747235677895',
            doctorAddress: '0xBB15C1c02A152C29Db1F4BB8941F15653De09B10',
            newPrivateCID: `QmUpdatedPrivate${Date.now()}`,
            newPublicCID: `QmUpdatedPublic${Date.now()}`
        };

        console.log('\nUpdating records with data:', testData);

        // Update both private and public records
        const result = await blockchainUtils.updateMedicalRecords(
            testData.patientId,
            testData.doctorId,
            testData.newPrivateCID,
            testData.newPublicCID,
            testData.doctorAddress
        );

        console.log('\nUpdate successful!');
        console.log('Transaction hash:', result.transactionHash);
        console.log('\nNew CIDs:');
        console.log('Private:', result.privateCID);
        console.log('Public:', result.publicCID);

        return {
            success: true,
            transactionHash: result.transactionHash,
            newPrivateCID: result.privateCID,
            newPublicCID: result.publicCID
        };

    } catch (error) {
        console.error('Error updating records:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

if (require.main === module) {
    updatePatientRecords()
        .then(result => {
            console.log('\nUpdate Results:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Update failed:', error);
            process.exit(1);
        });
}

export { updatePatientRecords };
