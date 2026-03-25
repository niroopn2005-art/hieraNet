import { blockchainUtils } from '../utils/blockchain-utils';
import dotenv from 'dotenv';
import path from 'path';
import Web3 from 'web3';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface DoctorData {
    isRegistered: boolean;
    walletAddress: string;
}

interface RecordData {
    privateCID: string;
    publicCID: string | null;
}

interface VerificationResult {
    success: boolean;
    error?: string;
    privateCID?: string;
    publicCID?: string;
    isRecent: boolean;
}

interface DoctorResponse {
    isRegistered: boolean;
    walletAddress: string;
}

interface DoctorDetails {
    isRegistered: boolean;
    walletAddress: string;
}

async function verifyRecordUpdates(): Promise<VerificationResult> {
    try {
        console.log('Starting record verification...');
        
        const contract = blockchainUtils.getContract();
        const testData = {
            doctorId: 'DOC003',
            patientId: 'PAT1747235677895',
            doctorAddress: '0xBB15C1c02A152C29Db1F4BB8941F15653De09B10'
        };

        try {
            const doctorExists = await contract.methods.isDoctorRegistered(testData.doctorId).call() as boolean;
            if (!doctorExists) {
                throw new Error('Doctor not registered in the system');
            }

            const doctor = await blockchainUtils.getDoctorDetails(testData.doctorId);
            if (!doctor.isRegistered) {
                throw new Error('Invalid doctor data');
            }

            console.log('\nDoctor verification successful');
            console.log('Doctor wallet:', doctor.walletAddress);

            const records = await blockchainUtils.getRecords(testData.patientId);

            console.log('\nCurrent Records:');
            console.log('Private CID:', records.privateCID || 'Not found');

            const isRecent = (cid: string): boolean => {
                const timestamp = cid.match(/\d+$/);
                if (!timestamp) return false;
                const updateTime = parseInt(timestamp[0]);
                const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
                return updateTime > fiveMinutesAgo;
            };

            return {
                success: true,
                privateCID: records.privateCID || undefined,
                isRecent: records.privateCID ? isRecent(records.privateCID) : false
            };

        } catch (contractError) {
            throw new Error(`Contract error: ${contractError instanceof Error ? contractError.message : 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Verification failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            isRecent: false
        };
    }
}

if (require.main === module) {
    verifyRecordUpdates()
        .then(result => {
            console.log('\nVerification Results:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Verification failed:', error);
            process.exit(1);
        });
}

export { verifyRecordUpdates };
