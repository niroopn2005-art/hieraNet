import { blockchainUtils } from '../utils/blockchain-utils';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkRegistration(doctorId: string, patientId: string) {
    try {
        const contract = blockchainUtils.getContract();

        // Check doctor registration with proper type assertions
        const isDoctorRegistered = await contract.methods.isDoctorRegistered(doctorId).call();
        console.log(`\nDoctor ${doctorId} registration status:`, isDoctorRegistered ? 'Registered' : 'Not registered');

        if (isDoctorRegistered) {
            const doctor = await blockchainUtils.getDoctorDetails(doctorId);
            console.log('Doctor wallet:', doctor.walletAddress);
        }

        // Check patient registration with proper type assertions
        const isPatientRegistered = await contract.methods.isPatientRegistered(patientId).call();
        console.log(`\nPatient ${patientId} registration status:`, isPatientRegistered ? 'Registered' : 'Not registered');

        if (isPatientRegistered) {
            const patient = await blockchainUtils.getPatientDetails(patientId);
            console.log('Patient wallet:', patient.walletAddress);
            console.log('Registered by doctor:', patient.registeredBy);
        }

        return {
            success: true,
            doctorRegistered: isDoctorRegistered,
            patientRegistered: isPatientRegistered
        };
    } catch (error) {
        console.error('Error checking registration:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

if (require.main === module) {
    // Default test values
    const doctorId = 'DOC003';
    const patientId = 'PAT1747235677895';

    checkRegistration(doctorId, patientId)
        .then(result => {
            console.log('\nCheck Results:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Check failed:', error);
            process.exit(1);
        });
}

export { checkRegistration };
