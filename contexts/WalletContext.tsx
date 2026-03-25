"use client"
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import Web3 from 'web3';
import { contractABI } from '@/config/contract';  // Updated import path

export const WalletContext = createContext<any>(null);

interface WalletContextType {
    account: string | null;
    role: string | null;
    isConnecting: boolean;
    error: string | null;
    isInitialized: boolean;
    connectWallet: () => Promise<void>;
    registerDoctor: (doctorId: string) => Promise<void>;
    disconnect: () => void;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
    const [account, setAccount] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const connectWallet = useCallback(async () => {
        setIsConnecting(true);
        setError(null);

        try {
            if (!window.ethereum) {
                throw new Error('Please install MetaMask!');
            }

            const web3 = new Web3(window.ethereum);
            const accounts = await web3.eth.requestAccounts();
            const userAddress = accounts[0];

            const contract = new web3.eth.Contract(
                contractABI,
                process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
            );

            try {
                // Try to get patient ID first
                const patientId = await contract.methods.getPatientId(userAddress).call();
                if (patientId) {
                    setRole('patient');
                    setAccount(userAddress);
                    return;
                }
            } catch (err) {
                // If not a patient, check if doctor
                try {
                    const doctorId = await contract.methods.getDoctorId(userAddress).call();
                    if (doctorId) {
                        setRole('doctor');
                        setAccount(userAddress);
                        return;
                    }
                } catch (err) {
                    console.error('Not a doctor either:', err);
                }
            }
            
            throw new Error('Account not registered');
        } catch (err: any) {
            console.error('Error checking role:', err);
            setError(err.message || 'Failed to connect wallet');
            throw err;
        } finally {
            setIsConnecting(false);
        }
    }, []);

    const disconnect = useCallback(() => {
        setAccount(null);
        setRole(null);
        sessionStorage.removeItem('role');
    }, []);

    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts: string[]) => {
                if (accounts.length === 0) {
                    disconnect();
                } else {
                    setAccount(accounts[0]);
                }
            });
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', () => {});
            }
        }
    }, [disconnect]);

    const value = {
        account,
        role,
        isConnecting,
        error,
        isInitialized,
        connectWallet,
        disconnect
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
}

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
};
    

export default WalletProvider;