"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Layout } from "@/components/layout"
import { blockchainUtils } from '@/utils/blockchain-utils'

const PatientLogin = () => {
  const router = useRouter()
  const [patientId, setPatientId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [walletAddress, setWalletAddress] = useState('')

  const handleConnectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask first')
      }
      
      // Force MetaMask popup to allow account selection
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      })

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
      
      setWalletAddress(accounts[0])
      setError('') // Clear any previous errors
    } catch (err: any) {
      console.error('Wallet connection error:', err)
      if (err.code === 4001) {
        setError('Please connect your wallet to continue')
      } else {
        setError(err.message || 'Failed to connect wallet')
      }
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!walletAddress) {
        throw new Error('Please connect your wallet first')
      }

      if (!patientId.trim()) {
        throw new Error('Please enter Patient ID')
      }

      const contract = blockchainUtils.getContract()

      // Verify patient registration
      const isRegistered = await contract.methods.isPatientRegistered(patientId).call()
      if (!isRegistered) {
        throw new Error('Patient ID not found')
      }

      // Verify wallet matches patient
      const patient: any = await contract.methods.patients(patientId).call()
      if (patient.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error('Connected wallet does not match registered patient')
      }

      // Store verified data
      sessionStorage.setItem('patientId', patientId)
      sessionStorage.setItem('walletAddress', walletAddress)
      
      router.push('/patient/dashboard')
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container mx-auto flex min-h-screen items-center px-4">
        <Card className="mx-auto w-full max-w-md bg-green-50">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-800">
              Patient Login
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient ID</Label>
                <Input
                  id="patientId"
                  placeholder="Enter Patient ID"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Wallet Connection</Label>
                {walletAddress ? (
                  <p className="text-sm text-green-600 bg-green-100 p-2 rounded">
                    Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </p>
                ) : (
                  <Button
                    type="button"
                    onClick={handleConnectWallet}
                    className="w-full bg-green-600 hover:bg-green-700"
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
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading || !walletAddress}
              >
                {loading ? 'Verifying...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

export default PatientLogin

