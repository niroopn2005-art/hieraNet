"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PatientDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [patientId, setPatientId] = useState('')
  const [walletAddress, setWalletAddress] = useState('')

  useEffect(() => {
    const checkAuth = () => {
      const storedPatientId = sessionStorage.getItem('patientId')
      const storedWalletAddress = sessionStorage.getItem('walletAddress')

      if (!storedPatientId || !storedWalletAddress) {
        router.push('/patient/login')
      } else {
        setPatientId(storedPatientId)
        setWalletAddress(storedWalletAddress)
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleManageAccess = () => {
    router.push('/patient/manage-access')
  }

  const handleViewRecords = () => {
    router.push('/patient/view-records')
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 bg-gradient-to-b from-green-50 to-green-100 min-h-screen">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-800">Patient Dashboard</CardTitle>
            <div className="mt-2 text-sm text-gray-600">
              <p>Patient ID: <span className="font-semibold text-green-700">{patientId}</span></p>
              <p>Wallet: <span className="font-mono text-xs">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span></p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleManageAccess}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-green-700">Manage Access</h3>
                    <p className="text-gray-600 mt-2">Review and manage doctor access requests</p>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Manage Access
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={handleViewRecords}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-blue-700">View Records</h3>
                    <p className="text-gray-600 mt-2">View your medical records</p>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    View Records
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}