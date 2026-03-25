"use client";

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Layout } from "@/components/layout"

export default function DoctorDashboard() {
  const router = useRouter()
  const [patientId, setPatientId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [doctorId, setDoctorId] = useState("")
  const [walletAddress, setWalletAddress] = useState("")

  useEffect(() => {
    // Check if doctor is logged in
    const storedDoctorId = sessionStorage.getItem('doctorId')
    const storedWallet = sessionStorage.getItem('doctorWallet')
    
    if (!storedDoctorId || !storedWallet) {
      alert('Please login first')
      router.push('/doctor/login')
      return
    }

    setDoctorId(storedDoctorId)
    setWalletAddress(storedWallet)
  }, [router])

  const handleViewRecords = () => {
    if (!patientId.trim()) {
      alert('Please enter a patient ID')
      return
    }
    router.push(`/doctor/view-records?patientId=${patientId}`)
  }

  const handleUpdateRecords = () => {
    if (!patientId.trim()) {
      alert('Please enter a patient ID')
      return
    }
    router.push(`/doctor/update-records?patientId=${patientId}`)
  }

  const handleRegisterPatient = () => {
    router.push('/doctor/register-patient')
  }

  const handleLogout = () => {
    sessionStorage.removeItem('doctorId')
    sessionStorage.removeItem('doctorWallet')
    router.push('/doctor/login')
  }

  if (!doctorId) {
    return null // Will redirect to login
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 bg-gradient-to-b from-blue-50 to-blue-100 min-h-screen">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-blue-800">Doctor Dashboard</CardTitle>
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="text-sm"
              >
                Logout
              </Button>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              <p>Doctor ID: <span className="font-semibold">{doctorId}</span></p>
              <p>Wallet: <span className="font-mono text-xs">{walletAddress}</span></p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Input
                placeholder="Enter Patient ID"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              />
              
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleViewRecords}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!patientId || isLoading}
                >
                  {isLoading ? "Processing..." : "View Records"}
                </Button>
                
                <Button 
                  onClick={handleUpdateRecords}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!patientId || isLoading}
                >
                  {isLoading ? "Processing..." : "Update Records"}
                </Button>
              </div>
            </div>

            <div className="border-t pt-4">
              <Button 
                onClick={handleRegisterPatient}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Register New Patient
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

