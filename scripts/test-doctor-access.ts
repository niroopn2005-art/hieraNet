import { blockchainUtils } from '../utils/blockchain-utils';
import dotenv from 'dotenv';
import path from 'path';
import Web3 from 'web3';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface DoctorData {
    isRegistered: boolean;
    walletAddress: string;
}

interface AccessTestResult {
    success: boolean;
    doctorId: string;
    patientId: string;
    viewAccess: boolean;
    updateAccess: boolean;
    records?: {
        privateCID?: string;
        publicCID?: string;
    };
}

async function testDoctorAccess(): Promise<AccessTestResult> {
    console.log('Starting doctor access test...');
    
    try {
        const web3 = new Web3(process.env.NEXT_PUBLIC_ETHEREUM_NODE_URL!);
        const contract = blockchainUtils.getContract();

        // Get accounts
        const accounts = await web3.eth.getAccounts();
        console.log('\nAvailable accounts:', accounts);

        // Test data
        const doctorId = 'DOC001';
        const patientId = 'PAT1747235677895';
        const doctorAddress = '0xc87782782623E971Bd1EeA997A9DCe092E9414E0'; // Using registered doctor address
        
        console.log('\nTesting access for:');
        console.log('Doctor ID:', doctorId);
        console.log('Patient ID:', patientId);

        // Verify doctor exists
        const doctorExists = await contract.methods.isDoctorRegistered(doctorId).call();
        console.log('\nDoctor registration status:', doctorExists ? 'Registered' : 'Not registered');

        if (!doctorExists) {
            throw new Error('Doctor not registered');
        }

        // Get doctor's data with proper typing
        const doctorData = await contract.methods.doctors(doctorId).call() as DoctorData;
        console.log('Doctor address:', doctorData.walletAddress);

        // Set doctor as the sender for view operations
        web3.eth.defaultAccount = doctorAddress;

        // Check view access with proper type casting
        const hasViewAccess = Boolean(await contract.methods.checkViewAccess(patientId, doctorId).call({
            from: doctorAddress
        }));
        console.log('\nView Access:', hasViewAccess ? 'Granted' : 'Not granted');

        // Check update access with proper type casting
        const hasUpdateAccess = Boolean(await contract.methods.checkUpdateAccess(patientId, doctorId).call({
            from: doctorAddress
        }));
        console.log('Update Access:', hasUpdateAccess ? 'Granted' : 'Not granted');

        // Try to view records if has access
        let records;
        if (hasViewAccess) {
            try {
                const privateCID = await contract.methods.viewMedicalRecord(patientId).call({
                    from: doctorAddress
                });
                console.log('\nMedical Record CID:', privateCID || 'No record found');
            } catch (error) {
                console.error('Error viewing medical record:', 
                    error instanceof Error ? error.message : 'Unknown error');
            }
        }

        return {
            success: true,
            doctorId,
            patientId,
            viewAccess: hasViewAccess,
            updateAccess: hasUpdateAccess,
            records: hasViewAccess ? records : undefined
        };
    } catch (error) {
        console.error('Test failed:', error);
        throw error;
    }
}

// Run if executed directly
if (require.main === module) {
    testDoctorAccess()
        .then(result => {
            console.log('\nTest Results:', result);
            process.exit(0);
        })
        .catch(error => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

export { testDoctorAccess };
