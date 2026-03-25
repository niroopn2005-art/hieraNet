"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { blockchainUtils } from "@/utils/blockchain-utils"

export default function DoctorLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [doctorId, setDoctorId] = useState("")
  const [error, setError] = useState("")
  const [walletAddress, setWalletAddress] = useState("")

  const handleWalletConnect = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask first")
      }

      // Force MetaMask popup
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      })

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      setWalletAddress(accounts[0])
    } catch (error: any) {
      console.error("Wallet connection error:", error)
      setError(error.message || "Failed to connect wallet")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (!walletAddress) {
        throw new Error("Please connect your wallet first")
      }

      const contract = blockchainUtils.getContract()

      // Verify doctor exists
      const isRegistered = await contract.methods.isDoctorRegistered(doctorId).call()
      if (!isRegistered) {
        throw new Error("Doctor ID not found")
      }

      // Verify wallet matches
      const doctor = await contract.methods.doctors(doctorId).call()
      if (doctor.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error("Connected wallet doesn't match registered doctor")
      }

      // Store doctor session
      sessionStorage.setItem('doctorId', doctorId)
      sessionStorage.setItem('doctorWallet', walletAddress)

      router.push('/doctor/dashboard')
    } catch (error: any) {
      console.error("Login error:", error)
      setError(error.message || "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container mx-auto flex min-h-screen items-center px-4">
        <Card className="mx-auto w-full max-w-md bg-blue-50">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-800">Doctor Login</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doctorId">Doctor ID</Label>
                <Input
                  id="doctorId"
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Wallet Connection</Label>
                {walletAddress ? (
                  <p className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    Connected: {walletAddress}
                  </p>
                ) : (
                  <Button
                    type="button"
                    onClick={handleWalletConnect}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Connect MetaMask
                  </Button>
                )}
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading || !walletAddress}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

