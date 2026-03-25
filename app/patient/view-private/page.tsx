"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
  const [showCidInput, setShowCidInput] = useState(true)
  const [cid, setCid] = useState("")
  const [records, setRecords] = useState<PrivateRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const patientId = sessionStorage.getItem('patientId')
    if (!patientId) {
      router.push('/patient/login')
    }
  }, [router])

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
      
      // Skip header row and process data rows
      for (let i = 1; i < rows.length; i++) {
        const [Feature, Data] = rows[i].split(',')
        if (Feature && Data) {
          records.push({ Feature: Feature.trim(), Data: Data.trim() })
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
                Private Medical Records
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