"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { blockchainUtils } from "@/utils/blockchain-utils"

export default function AdminLogin() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verifyAdminWallet = async (walletAddress: string) => {
    try {
      const contract = blockchainUtils.getContract()
      const adminAddress = await contract.methods.admin().call()
      return walletAddress.toLowerCase() === adminAddress.toLowerCase()
    } catch (error) {
      console.error("Admin verification error:", error)
      return false
    }
  }

  const handleWalletConnect = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!window.ethereum) {
        throw new Error("Please install MetaMask to continue")
      }

      // Force MetaMask popup
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      })

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      const selectedAccount = accounts[0]
      
      // Verify against smart contract admin
      const isAdmin = await verifyAdminWallet(selectedAccount)
      
      if (!isAdmin) {
        throw new Error("Connected wallet is not the admin")
      }

      // Store verified admin session
      sessionStorage.setItem('isAdmin', 'true')
      sessionStorage.setItem('adminAddress', selectedAccount)

      // Test contract connection
      await blockchainUtils.testConnection()

      router.push('/admin/dashboard')
    } catch (error: any) {
      if (error.code === 4001) {
        setError("Please connect your admin wallet to continue")
      } else {
        setError(error.message || "Failed to connect wallet")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center px-4">
        <Card className="mx-auto w-full max-w-md bg-white border border-red-100">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-800">Admin Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-white rounded-lg">
              <p className="text-gray-600 mb-4">Connect your admin wallet to continue</p>
              <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full p-3">
                <svg className="w-full h-full text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
                {error}
              </div>
            )}
            <Button
              onClick={handleWalletConnect}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Connecting..." : "Connect Admin Wallet"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
