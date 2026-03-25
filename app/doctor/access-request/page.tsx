"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Layout } from "@/components/layout"

export default function AccessRequest() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams?.get('patientId') || ''
  const accessType = searchParams?.get('type') || ''
  const [isLoading, setIsLoading] = useState(false)

  const handleRequestAccess = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/access-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId: sessionStorage.getItem('doctorId'),
          patientId,
          accessType
        }),
      })

      const data = await response.json()
      if (data.success) {
        alert(`${accessType} access request sent to patient`)
        router.push('/doctor/dashboard')
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      alert("Failed to send request")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 bg-gradient-to-b from-blue-50 to-blue-100 min-h-screen">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-blue-800">
              Request {accessType} Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              You are requesting {accessType.toLowerCase()} access for patient ID: {patientId}
            </p>
            <div className="flex gap-4">
              <Button
                onClick={handleRequestAccess}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Sending Request..." : "Send Request"}
              </Button>
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
} 