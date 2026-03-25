import { useEffect } from 'react';
import { useRouter } from 'next/router';

const PatientDashboard = () => {
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const isAuthenticated = localStorage.getItem('patientAuth');
            if (!isAuthenticated) {
                router.push('/patient/login');
                return;
            }
            
            // Verify wallet connection is still valid
            try {
                const accounts = await window.ethereum.request({
                    method: 'eth_accounts'
                });
                const storedWallet = localStorage.getItem('patientWallet');
                if (!accounts.includes(storedWallet)) {
                    localStorage.removeItem('patientAuth');
                    localStorage.removeItem('patientWallet');
                    router.push('/patient/login');
                }
            } catch (error) {
                console.error('Wallet verification error:', error);
                router.push('/patient/login');
            }
        };
        checkAuth();
    }, []);

    // Add logout function
    const handleLogout = () => {
        localStorage.removeItem('patientAuth');
        localStorage.removeItem('patientWallet');
        router.push('/patient/login');
    };

    return (
        <div>
            <h1>Patient Dashboard</h1>
            <button onClick={handleLogout}>Logout</button>
            {/* Existing dashboard content */}
        </div>
    );
}

export default PatientDashboard;