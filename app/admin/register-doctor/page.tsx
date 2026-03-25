"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useWallet } from "@/contexts/WalletContext"
import { blockchainUtils } from "@/utils/blockchain-utils"

export default function RegisterDoctorPage() {
  const router = useRouter()
  const { account } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [doctorAddress, setDoctorAddress] = useState("")
  const [formData, setFormData] = useState({
    doctorId: '',
    name: '',
    specialization: '',
    email: '',
    phone: ''
  })
  const [error, setError] = useState<string | null>(null)

  const handleDoctorWalletConnect = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found! Please install MetaMask first.")
      }

      // Request account access
      await window.ethereum.enable();

      // Reset active wallet connections
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });

      // Get the accounts
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts && accounts[0]) {
        setDoctorAddress(accounts[0]);
        console.log("Doctor's wallet connected:", accounts[0]);
      } else {
        throw new Error("No accounts found");
      }

    } catch (error: any) {
      console.error("Wallet connection error:", error);
      setError(error.message || "Failed to connect wallet");
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Initial validations
      if (!account) {
        throw new Error("Admin wallet not connected");
      }

      if (!doctorAddress) {
        throw new Error("Doctor's wallet not connected");
      }

      if (!formData.doctorId) {
        throw new Error("Doctor ID is required");
      }

      // Get contract instance
      const contract = blockchainUtils.getContract();

      // First verify admin
      const adminAddress = await contract.methods.admin().call();
      console.log("Admin:", adminAddress, "Connected:", account);
      
      if (account.toLowerCase() !== adminAddress.toLowerCase()) {
        throw new Error("Not authorized as admin");
      }

      // Check if doctor exists
      const exists = await contract.methods.isDoctorRegistered(formData.doctorId).call();
      if (exists) {
        throw new Error("Doctor ID already registered");
      }

      console.log("Registering doctor with ID:", formData.doctorId, "and address:", doctorAddress);

      // Simple direct transaction
      const result = await contract.methods.registerDoctor(
        formData.doctorId,
        doctorAddress
      ).send({
        from: account,
        gas: '3000000'
      });

      console.log("Transaction successful:", result.transactionHash);
      router.push('/admin/dashboard');

    } catch (error: any) {
      console.error('Registration error:', error);
      // Better error messages
      if (error.message.includes('revert')) {
        setError('Transaction reverted: Invalid operation');
      } else if (error.message.includes('user rejected')) {
        setError('Transaction was rejected by user');
      } else if (error.message.includes('insufficient funds')) {
        setError('Insufficient funds for transaction');
      } else {
        setError(error.message || "Failed to register doctor");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Register New Doctor</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <Card className="bg-white shadow-lg">
            <CardHeader className="border-b border-gray-200 bg-red-50">
              <CardTitle className="text-xl text-red-800">Doctor Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleRegistration} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    placeholder="Doctor ID *"
                    value={formData.doctorId}
                    onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                    className="border-gray-300 focus:border-blue-500"
                    required
                  />

                  <Input
                    placeholder="Full Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="border-gray-300 focus:border-blue-500"
                    required
                  />

                  <Input
                    placeholder="Specialization *"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="border-gray-300 focus:border-blue-500"
                    required
                  />

                  <Input
                    placeholder="Email *"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="border-gray-300 focus:border-blue-500"
                    required
                  />

                  <Input
                    placeholder="Phone Number *"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="border-gray-300 focus:border-blue-500"
                    required
                  />
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Doctor's Wallet</label>
                    {doctorAddress ? (
                      <p className="text-green-600 text-sm font-medium bg-green-50 p-2 rounded">
                        Connected: {doctorAddress}
                      </p>
                    ) : (
                      <Button 
                        type="button"
                        onClick={handleDoctorWalletConnect}
                        variant="outline"
                        className="w-full border-blue-500 text-blue-600 hover:bg-blue-50"
                      >
                        Connect Doctor's Wallet
                      </Button>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading || !account || !doctorAddress}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {isLoading ? "Registering..." : "Register Doctor"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
