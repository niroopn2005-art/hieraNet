"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getWeb3Instance } from '@/utils/web3';

export default function PatientLogin() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setLoading(true);
        setError('');

        try {
            const { web3, contract } = await getWeb3Instance();
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            const userAddress = accounts[0];

            try {
                // First check if wallet is registered as a patient
                const patientId = await contract.methods.getPatientId(userAddress).call();
                
                // Verify patient registration
                const isRegistered = await contract.methods.isPatientRegistered(patientId).call();
                
                if (!isRegistered) {
                    throw new Error('Patient not registered');
                }

                // Store authentication data
                localStorage.setItem('patientAuth', 'true');
                localStorage.setItem('patientId', patientId);
                localStorage.setItem('walletAddress', userAddress);

                router.push('/patient/dashboard');
            } catch (contractError: any) {
                // Handle specific contract errors
                if (contractError.message.includes('Patient not found')) {
                    throw new Error('This wallet is not registered as a patient');
                }
                throw contractError;
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold mb-6 text-center">Patient Login</h2>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}
                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {loading ? 'Connecting...' : 'Connect with MetaMask'}
                </button>
            </div>
        </div>
    );
}