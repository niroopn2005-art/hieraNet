import Web3 from 'web3';
import type { Contract } from 'web3-eth-contract';
import type { AbiItem } from 'web3-utils';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Validate required environment variables
const REQUIRED_ENV_VARS = [
    'NEXT_PUBLIC_ETHEREUM_NODE_URL',
    'NEXT_PUBLIC_CONTRACT_ADDRESS'
] as const;

// Types
interface Patient {
    walletAddress: string;
    isRegistered: boolean;
    privateCID: string;
    registeredBy: string;
}

interface MultiChainConfig {
    port: string | undefined;
    host: string | undefined;
    user: string | undefined;
    pass: string | undefined;
}

// Initialize Web3 with proper environment variables
const web3 = new Web3(new Web3.providers.HttpProvider(
    process.env.NEXT_PUBLIC_ETHEREUM_NODE_URL!
));

// Initialize contract with proper typing
const contract = new web3.eth.Contract(
    contractABI as AbiItem[],
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
);

// Initialize MultiChain with proper error handling
const multichainConfig: MultiChainConfig = {
    port: process.env.NEXT_PUBLIC_MULTICHAIN_PORT,
    host: process.env.NEXT_PUBLIC_MULTICHAIN_HOST,
    user: process.env.NEXT_PUBLIC_MULTICHAIN_USER,
    pass: process.env.NEXT_PUBLIC_MULTICHAIN_PASS
};

const multichain = require('multichain-node')(multichainConfig);

// Helper functions with proper error handling and types
async function verifyPatientKey(patientId: string, address: string): Promise<boolean> {
    try {
        const patient = await contract.methods.patients(patientId).call() as Patient;
        return patient.walletAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
        console.error('Error verifying patient:', error);
        return false;
    }
}

async function checkDoctorExists(doctorId: string): Promise<boolean> {
    try {
        return await contract.methods.isDoctorRegistered(doctorId).call();
    } catch (error) {
        console.error('Error checking doctor:', error);
        return false;
    }
}

// Export utility functions with proper typing and error handling
export const blockchainUtils = {
    web3,
    contract,
    multichain,
    verifyPatientKey,
    checkDoctorExists,
    
    uploadCIDs: async (
        patientId: string,
        doctorId: string,
        patientAddress: string,
        privateCID: string,
        publicCID: string,
        walletAddress: string
    ) => {
        try {
            const tx = await contract.methods.registerPatient(
                patientId,
                doctorId,
                patientAddress,
                privateCID
            ).send({
                from: walletAddress,
                gas: '3000000'
            });

            const hexData = Buffer.from(publicCID).toString('hex');
            await new Promise((resolve, reject) => {
                multichain.publish({
                    stream: 'medical_records',
                    key: patientId,
                    data: hexData
                }, (err: Error | null) => {
                    if (err) reject(err);
                    else resolve(true);
                });
            });

            return {
                success: true,
                ethereumTx: tx.transactionHash
            };
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    },

    getRecords: async (patientId: string) => {
        try {
            const [privateCID, publicRecords] = await Promise.all([
                contract.methods.viewMedicalRecord(patientId).call(),
                new Promise<any[]>((resolve, reject) => {
                    multichain.listStreamKeyItems(
                        ['medical_records', patientId],
                        (err: Error | null, items: any[]) => {
                            if (err) reject(err);
                            else resolve(items || []);
                        }
                    );
                })
            ]);

            const publicCID = publicRecords.length > 0
                ? Buffer.from(publicRecords[publicRecords.length - 1].data, 'hex').toString()
                : null;

            return { privateCID, publicCID };
        } catch (error) {
            console.error('Error fetching records:', error);
            throw error;
        }
    },

    // Add connection test function
    testConnection: async () => {
        try {
            const [networkId, admin] = await Promise.all([
                web3.eth.net.getId(),
                contract.methods.admin().call()
            ]);
            
            return {
                success: true,
                networkId: Number(networkId),
                admin,
                message: 'Connection test successful'
            };
        } catch (error) {
            throw new Error(
                'Connection test failed: ' + (error instanceof Error ? error.message : String(error))
            );
        }
    }
};
