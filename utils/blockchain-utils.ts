import Web3 from 'web3';
import type { Contract } from 'web3-eth-contract';
import type { AbiItem } from 'web3-utils';
import path from 'path';
import dotenv from 'dotenv';
import { contractABI } from '../final/final/contractABI';

// Load environment variables at the start
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Validate environment variables
const REQUIRED_ENV_VARS = [
    'NEXT_PUBLIC_ETHEREUM_NODE_URL',
    'NEXT_PUBLIC_CONTRACT_ADDRESS'
] as const;

function validateEnvVars() {
    const missing = REQUIRED_ENV_VARS.filter(envVar => {
        const value = process.env[envVar];
        return !value || value.trim() === '';
    });
    
    if (missing.length > 0) {
        console.warn('Missing environment variables:', missing.join(', '));
        return false;
    }
    return true;
}

// Define interfaces for contract responses
interface Patient {
    isRegistered: boolean;
    walletAddress: string;
    privateCID: string;
    registeredBy: string;
}

interface ContractResponse {
    patients: (patientId: string) => Promise<Patient>;
}

// Define a type for the contract ABI
type ContractAbi = typeof contractABI;

declare global {
    interface Window {
        ethereum: any;
    }
}

interface MultiChainResponse {
    data: string;
}

// Add better error handling and logging
class BlockchainError extends Error {
    constructor(message: string, public readonly code?: string) {
        super(message);
        this.name = 'BlockchainError';
    }
}

interface PatientData {
    isRegistered: boolean;
    walletAddress: string;
    privateCID: string;
    registeredBy: string;
}

interface ContractPatient {
    isRegistered: boolean;
    walletAddress: string;
    privateCID: string;
    registeredBy: string;
}

interface DoctorData {
    isRegistered: boolean;
    walletAddress: string;
    viewAccess: Record<string, boolean>;
    updateAccess: Record<string, boolean>;
}

interface RecordResponse {
    privateCID: string;
    publicCID: string | null;
}

interface DoctorDetails {
    isRegistered: boolean;
    walletAddress: string;
}

interface PatientDetails {
    isRegistered: boolean;
    walletAddress: string;
    registeredBy: string;
}

interface DoctorContractResponse {
    isRegistered: boolean;
    walletAddress: string;
}

interface PatientContractResponse {
    isRegistered: boolean;
    walletAddress: string;
    registeredBy: string;
}

export class BlockchainService {
    private web3: Web3;
    private contract: Contract<typeof contractABI>;
    public multichain: any;

    constructor() {
        const isValid = validateEnvVars();
        
        const nodeUrl = process.env.NEXT_PUBLIC_ETHEREUM_NODE_URL || 'http://localhost:7545';
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

        try {
            this.web3 = new Web3(new Web3.providers.HttpProvider(nodeUrl));
            
            if (!contractABI || !Array.isArray(contractABI)) {
                throw new Error('Contract ABI is not properly defined');
            }

            if (contractAddress) {
                this.contract = new this.web3.eth.Contract(
                    contractABI,
                    contractAddress
                ) as Contract<typeof contractABI>;
            } else {
                throw new Error('Contract address not found in environment variables');
            }

            // Modified MultiChain initialization
            if (typeof window !== 'undefined') {
                // Client-side
                this.multichain = {
                    getInfo: async () => {
                        const response = await fetch('/api/multichain/info');
                        if (!response.ok) throw new Error('MultiChain connection failed');
                        return response.json();
                    },
                    publish: async (params: any) => {
                        const response = await fetch('/api/multichain/publish', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(params),
                        });
                        if (!response.ok) throw new Error('MultiChain publish failed');
                        return response.json();
                    },
                    listStreamKeyItems: async (params: any) => {
                        const response = await fetch('/api/multichain/list-items', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ params }),
                        });
                        if (!response.ok) throw new Error('MultiChain list items failed');
                        return response.json();
                    }
                };
            } else {
                // Server-side
                const multichainConfig = {
                    port: process.env.NEXT_PUBLIC_MULTICHAIN_PORT || 6834,
                    host: process.env.NEXT_PUBLIC_MULTICHAIN_HOST || 'localhost',
                    user: process.env.NEXT_PUBLIC_MULTICHAIN_USER || 'multichainrpc',
                    pass: process.env.NEXT_PUBLIC_MULTICHAIN_PASS
                };
                this.multichain = require('multichain-node')(multichainConfig);
            }
        } catch (error) {
            console.error('BlockchainService initialization error:', error);
            throw error;
        }
    }

    getContract(): Contract<typeof contractABI> {
        return this.contract;
    }

    public getWeb3(): Web3 {
        return this.web3;
    }

    async verifyPatientAddress(patientId: string, address: string) {
        try {
            // First check if patient is registered
            const isRegistered = await this.contract!.methods.isPatientRegistered(patientId).call();
            if (!isRegistered) {
                return false;
            }

            // Get patient data with proper type assertion
            const patient = await this.contract!.methods.patients(patientId).call() as ContractPatient;
            return patient.walletAddress.toLowerCase() === address.toLowerCase();
        } catch (error) {
            console.error('Error verifying patient:', error);
            return false;
        }
    }

    async checkDoctorExists(doctorId: string) {
        try {
            return await this.contract!.methods.isDoctorRegistered(doctorId).call();
        } catch (error) {
            console.error('Error checking doctor:', error);
            return false;
        }
    }

    async isWalletAlreadyRegistered(wallet: string): Promise<boolean> {
        try {
            const patient = await this.contract.methods.walletToPatientId(wallet).call();
            const doctor = await this.contract.methods.walletToDoctorId(wallet).call();
            return !!(patient || doctor); // Returns true if either exists
        } catch (error) {
            console.log('Wallet check error (expected):', error);
            return false;
        }
    }

    async handleCIDUpload(
        patientId: string,
        doctorId: string,
        patientWallet: string,
        privateCID: any,
        publicCID: any,
        from: string
    ): Promise<void> {
        try {
            console.log('Starting patient registration process:', {
                patientId,
                doctorId,
                patientWallet
            });

            // Check if wallet is already registered
            const isWalletRegistered = await this.isWalletAlreadyRegistered(patientWallet);
            if (isWalletRegistered) {
                throw new Error('This wallet address is already registered to another user');
            }

            // Validate CIDs
            const privateHash = privateCID?.data?.privateCID || privateCID;
            const publicHash = publicCID?.data?.publicCID || publicCID;

            if (!privateHash || !publicHash) {
                throw new Error('Missing or invalid CID data');
            }

            console.log('Proceeding with registration:', {
                patientId,
                doctorId,
                patientWallet,
                privateHash: privateHash.substring(0, 10) + '...',
                publicHash: publicHash.substring(0, 10) + '...'
            });

            // Register on blockchain
            const contract = this.getContract();
            try {
                // First check if patient ID is already registered
                const isPatientRegistered = await contract.methods.isPatientRegistered(patientId).call();
                if (isPatientRegistered) {
                    throw new Error('Patient ID already registered');
                }

                // Verify doctor exists
                const isDoctorRegistered = await contract.methods.isDoctorRegistered(doctorId).call();
                if (!isDoctorRegistered) {
                    throw new Error('Doctor ID not found');
                }

                // Proceed with registration
                const registerResult = await contract.methods
                    .registerPatient(patientId, doctorId, patientWallet, privateHash)
                    .send({
                        from,
                        gas: '3000000' // Fixed gas limit
                    });

                console.log('Patient registered on blockchain:', {
                    transactionHash: registerResult.transactionHash
                });

                // Store public data in MultiChain
                const timestamp = new Date().toISOString();
                await this.multichain.publish({
                    stream: 'medical_records',
                    key: `${patientId}_${timestamp}`,
                    data: Buffer.from(JSON.stringify({
                        cid: publicHash,
                        timestamp,
                        version: `v${Date.now()}`
                    })).toString('hex')
                });

                console.log('Registration complete:', {
                    patientId,
                    transactionHash: registerResult.transactionHash
                });

            } catch (error: any) {
                console.error('Registration error:', error);
                if (error.message.includes('revert')) {
                    throw new Error('Registration failed: ' + (error.reason || 'Contract requirements not met'));
                }
                throw new Error(`Registration failed: ${error.message}`);
            }

        } catch (error) {
            console.error('CID Upload error:', error);
            throw error;
        }
    }

    async getRecords(patientId: string): Promise<{privateCID: string; publicCID: string | null}> {
        try {
            const privateCID = await this.contract.methods
                .viewMedicalRecord(patientId)
                .call() as string;

            let publicCID = null;
            if (this.multichain) {
                try {
                    const records = await new Promise<any[]>((resolve, reject) => {
                        this.multichain.listStreamKeyItems(
                            ['medical_records', patientId],
                            (err: Error | null, items: any[]) => {
                                if (err) reject(err);
                                else resolve(items || []);
                            }
                        );
                    });

                    if (records && records.length > 0) {
                        publicCID = Buffer.from(records[records.length - 1].data, 'hex').toString();
                    }
                } catch (err) {
                    console.error('MultiChain record fetch error:', err);
                }
            }

            return {
                privateCID: privateCID || '',
                publicCID
            };
        } catch (error) {
            console.error('Error fetching records:', error);
            throw error;
        }
    }

    public async testConnection() {
        try {
            const web3 = this.getWeb3();
            const contract = this.getContract();
            if (!contract) {
                throw new Error('Contract not initialized');
            }
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
            throw new BlockchainError(
                'Connection test failed: ' + (error instanceof Error ? error.message : String(error))
            );
        }
    }

    // Add updateMedicalRecord method
    async updateMedicalRecords(
        patientId: string,
        doctorId: string,
        newPrivateCID: string,
        newPublicCID: string,
        doctorAddress: string
    ) {
        try {
            // Update private CID on Ethereum
            const result = await this.contract!.methods.updateMedicalRecord(
                patientId,
                newPrivateCID
            ).send({
                from: doctorAddress,
                gas: '3000000'
            });

            // Update public CID on MultiChain if available
            if (this.multichain) {
                const hexData = Buffer.from(newPublicCID).toString('hex');
                await new Promise((resolve, reject) => {
                    this.multichain.publish({
                        stream: 'medical_records',
                        key: patientId,
                        data: hexData
                    }, (err: any) => {
                        if (err) reject(err);
                        else resolve(true);
                    });
                });
            }

            return {
                success: true,
                transactionHash: result.transactionHash,
                privateCID: newPrivateCID,
                publicCID: newPublicCID
            };
        } catch (error) {
            console.error('Update error:', error);
            throw error;
        }
    }

    async getDoctorDetails(doctorId: string): Promise<DoctorDetails> {
        const doctor = await this.contract.methods.doctors(doctorId).call() as DoctorContractResponse;
        return {
            isRegistered: doctor.isRegistered,
            walletAddress: doctor.walletAddress
        };
    }

    async getPatientDetails(patientId: string): Promise<PatientDetails> {
        const patient = await this.contract.methods.patients(patientId).call() as PatientContractResponse;
        return {
            isRegistered: patient.isRegistered,
            walletAddress: patient.walletAddress,
            registeredBy: patient.registeredBy
        };
    }
}

// Single implementation of test function
const testBlockchainService = async () => {
    const service = new BlockchainService();
    try {
        const web3 = service.getWeb3();
        if (web3) {
            const isConnected = await web3.eth.net.isListening();
            console.log('Web3 Connection Test:', isConnected);
            return true;
        }
        return false;
    } catch (error) {
        console.error('BlockchainService test failed:', error);
        return false;
    }
};

// Run test only in development
if (process.env.NODE_ENV === 'development' && require.main === module) {
    testBlockchainService()
        .then(result => console.log('BlockchainService Test Result:', result))
        .catch(console.error);
}

// Create and export a single instance

const blockchainService = new BlockchainService();
export { blockchainService as blockchainUtils };
export default blockchainService;

