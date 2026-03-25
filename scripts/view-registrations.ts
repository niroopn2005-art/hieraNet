import { blockchainUtils } from '../utils/blockchain-utils';
import dotenv from 'dotenv';
import path from 'path';
import Web3 from 'web3';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

interface DoctorInfo {
    isRegistered: boolean;
    walletAddress: string;
}

interface PatientInfo {
    isRegistered: boolean;
    walletAddress: string;
    privateCID: string;
    registeredBy: string;
}

async function viewRegistrations() {
    try {
        console.log('Checking existing registrations...\n');
        const web3 = blockchainUtils.getWeb3();
        const contract = blockchainUtils.getContract();

        const accounts = await web3.eth.getAccounts();
        console.log('Available accounts:', accounts);

        // Check admin
        const adminAddress = await contract.methods.admin().call();
        console.log('\nAdmin address:', adminAddress);

        // Check doctor
        const doctorId = 'DOC001';
        console.log('\nChecking Doctor (DOC001):');
        try {
            const doctorInfo = await contract.methods.doctors(doctorId).call() as DoctorInfo;
            if (doctorInfo.isRegistered) {
                console.log('- Registered:', doctorInfo.isRegistered);
                console.log('- Wallet Address:', doctorInfo.walletAddress);
            } else {
                console.log('Doctor not registered');
            }
        } catch (error) {
            console.error('Error fetching doctor:', error);
        }

        // Check patients
        for (let i = 1; i <= 5; i++) {
            const patientId = `PAT00${i}`;
            console.log(`\nChecking Patient (${patientId}):`);
            try {
                const isRegistered = await contract.methods.isPatientRegistered(patientId).call();
                if (isRegistered) {
                    const patientInfo = await contract.methods.patients(patientId).call() as PatientInfo;
                    console.log('- Registered:', true);
                    console.log('- Wallet Address:', patientInfo.walletAddress);
                    console.log('- Registered By:', patientInfo.registeredBy);
                } else {
                    console.log('Not registered');
                }
            } catch (error) {
                console.log('Not registered or error fetching data');
            }
        }

        return true;
    } catch (error) {
        console.error('Error viewing registrations:', error);
        return false;
    }
}

// Execute if run directly
if (require.main === module) {
    viewRegistrations()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export { viewRegistrations };
