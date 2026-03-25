"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
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
import Link from "next/link"

interface PrivateRecord {
  key: string
  value: string
}

export default function UpdatePrivateRecords() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams?.get('patientId') || ''
  const [key, setKey] = useState("")
  const [value, setValue] = useState("")
  const [records, setRecords] = useState<PrivateRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCidInput, setShowCidInput] = useState(false)
  const [previousCid, setPreviousCid] = useState("")

  const handleKeyValueSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (key.trim() && value.trim()) {
      setRecords([
        ...records,
        { key: key.trim(), value: value.trim() }
      ])
      setKey("")
      setValue("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleKeyValueSubmit(e)
    }
  }

  const handleUploadToIPFS = () => {
    setShowCidInput(true)
  }

  const handleFinalUpload = async () => {
    if (!previousCid) {
      alert("Please enter the previous CID")
      return
    }

    setIsLoading(true)
    try {
      // Fetch existing CSV from IPFS
      const fetchResponse = await fetch(`/api/fetch-ipfs?cid=${previousCid}`)
      const fetchData = await fetchResponse.json()

      if (!fetchData.success) {
        throw new Error('Failed to fetch previous records')
      }

      // Parse existing CSV
      const rows = fetchData.data.split('\n')
      const currentTime = new Date().toISOString()

      // Update the Created_At value and keep other rows unchanged
      const updatedRows = rows.map(row => {
        if (row.startsWith('Created_At,')) {
          return `Created_At,${currentTime}`
        }
        return row
      })

      // Add new records at the end
      records.forEach(record => {
        updatedRows.push(`${record.key},${record.value}`)
      })

      // Create final CSV content
      const csvData = updatedRows.join('\n')

      // Upload updated file to IPFS
      const formData = new FormData()
      const blob = new Blob([csvData], { type: 'text/csv' })
      formData.append('file', blob, 'records.csv')

      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        router.push(`/doctor/update-options?patientId=${patientId}`)
      } else {
        throw new Error(result.error || 'Failed to upload to IPFS')
      }
    } catch (error) {
      console.error('Error:', error)
      alert("Failed to process and upload records")
    } finally {
      setIsLoading(false)
    }
  }

  const createCSV = (records: PrivateRecord[]) => {
    const headers = "Key,Value\n"
    const rows = records.map(record => `${record.key},${record.value}`).join('\n')
    return headers + rows
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 bg-gradient-to-b from-blue-50 to-blue-100 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-blue-800">Update Private Records</h1>
            <Link href="/doctor/update-options">
              <Button variant="outline">← Back to Options</Button>
            </Link>
          </div>

          {/* Records Table */}
          {records.length > 0 && (
            <Card className="mb-6">
              <CardHeader className="space-y-1">
                <CardTitle className="text-blue-800">New Records to Add</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{record.key}</TableCell>
                        <TableCell>{record.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* CID Input Dialog */}
          {showCidInput && (
            <Card className="mb-6">
              <CardHeader className="space-y-1">
                <CardTitle className="text-blue-800">Enter Previous CID</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    placeholder="Enter the CID of previous records"
                    value={previousCid}
                    onChange={(e) => setPreviousCid(e.target.value)}
                  />
                  <div className="flex gap-4">
                    <Button
                      onClick={handleFinalUpload}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      disabled={!previousCid || isLoading}
                    >
                      {isLoading ? "Processing..." : "Confirm Upload"}
                    </Button>
                    <Button
                      onClick={() => setShowCidInput(false)}
                      className="flex-1"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Input Form */}
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-blue-800">Add New Record</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleKeyValueSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Enter key"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Input
                    placeholder="Enter value"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <div className="flex gap-4">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Add to Table
                  </Button>
                  <Button 
                    type="button"
                    onClick={handleUploadToIPFS}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={records.length === 0 || isLoading}
                  >
                    Upload to IPFS
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
} 