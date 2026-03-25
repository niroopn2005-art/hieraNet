"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface PrivateRecord {
  Feature: string
  Data: string
}

export default function ViewPrivateRecords() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams?.get('patientId')
  const [isChecking, setIsChecking] = useState(true)
  const [showCidInput, setShowCidInput] = useState(true)
  const [cid, setCid] = useState("")
  const [records, setRecords] = useState<PrivateRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const verifyAccess = async () => {
      const doctorId = sessionStorage.getItem('doctorId')
      if (!doctorId || !patientId) {
        router.push('/doctor/dashboard')
        return
      }

      const response = await fetch(
        `/api/check-access?doctorId=${doctorId}&patientId=${patientId}&accessType=VIEW`
      )
      const data = await response.json()

      if (!data.success || !data.hasAccess) {
        alert('You do not have access to view these records')
        router.push('/doctor/dashboard')
        return
      }

      setIsChecking(false)
    }

    verifyAccess()
  }, [patientId, router])

  const handleFetchRecords = async () => {
    if (!cid) {
      alert("Please enter CID")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/fetch-ipfs?cid=${cid}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch records')
      }

      // Parse CSV data
      const rows = data.data.split('\n')
      const records: PrivateRecord[] = []
      
      // Skip header row and process each row
      for (let i = 0; i < rows.length; i++) {
        const [feature, value] = rows[i].split(',')
        if (feature && value) {
          records.push({ Feature: feature, Data: value })
        }
      }

      setRecords(records)
      setShowCidInput(false)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to fetch records')
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return <Layout>
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Checking access...</span>
        </div>
      </div>
    </Layout>
  }

  return (
    <Layout>
      <div className="container mx-auto p-6">
        {showCidInput ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-blue-800">
                Enter Record CID
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter the CID of the records"
                value={cid}
                onChange={(e) => setCid(e.target.value)}
              />
              <Button
                onClick={handleFetchRecords}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Fetching..." : "View Records"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-blue-800">
                Private Records for Patient {patientId}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Feature</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{record.Feature}</TableCell>
                      <TableCell>{record.Data}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
} 