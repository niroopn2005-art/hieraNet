"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Layout } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function UpdateOptionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams?.get('patientId') || ''
  const [doctorId, setDoctorId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const id = sessionStorage.getItem('doctorId')
    if (!id) {
      router.push('/doctor/login')
      return
    }
    setDoctorId(id)
    verifyAccess(id)
  }, [router, patientId])

  const verifyAccess = async (doctorId: string) => {
    try {
      const response = await fetch(
        `/api/check-access?patientId=${patientId}&doctorId=${doctorId}`
      )
      const data = await response.json()

      if (!data.hasAccess) {
        router.push('/doctor/dashboard')
        alert('You do not have access to this patient\'s records')
        return
      }
      setIsLoading(false)
    } catch (error) {
      console.error('Error verifying access:', error)
      router.push('/doctor/dashboard')
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <p className="text-center">Verifying access...</p>
        </div>
      </Layout>
    )
  }

  const handleUpdatePrivate = () => {
    router.push(`/doctor/update-private?patientId=${patientId}`)
  }

  const handleUpdatePublic = () => {
    router.push(`/doctor/update-public?patientId=${patientId}`)
  }

  return (
    <Layout>
      <div className="container mx-auto min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/doctor/dashboard" className="text-blue-600 hover:text-blue-700">
                ← Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-blue-800">Update Patient Records</h1>
            <p className="text-gray-600 mt-2">Patient ID: {patientId}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Private Records Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-blue-800">Update Private Records</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Update sensitive medical information and personal details
                </p>
                <Button 
                  onClick={handleUpdatePrivate}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Update Private Records
                </Button>
              </CardContent>
            </Card>

            {/* Public Records Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-blue-800">Update Public Records</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Update general health metrics and non-sensitive information
                </p>
                <Button 
                  onClick={handleUpdatePublic}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Update Public Records
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  )
} 