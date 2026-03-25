"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { blockchainUtils } from "@/utils/blockchain-utils"

interface RecordData {
  cid: string
  data: any
  timestamp: string
  source: 'private' | 'public'
  error?: string
}

export default function ViewRecords() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<RecordData[]>([])
  const [error, setError] = useState('')
  const [patientId, setPatientId] = useState('')
  const [walletAddress, setWalletAddress] = useState('')

  useEffect(() => {
    const storedPatientId = sessionStorage.getItem('patientId')
    const storedWalletAddress = sessionStorage.getItem('walletAddress')
    
    if (!storedPatientId || !storedWalletAddress) {
      router.push('/patient/login')
    } else {
      setPatientId(storedPatientId)
      setWalletAddress(storedWalletAddress)
    }
  }, [router])

  const fetchFromIPFS = async (cid: string): Promise<any> => {
    try {
      const response = await fetch(`/api/ipfs/fetch?cid=${cid}&walletAddress=${walletAddress}&patientId=${patientId}&encrypted=true`)
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch from IPFS')
      }
      
      console.log(`🔓 Fetched and decrypted data from IPFS for CID: ${cid}`)
      return result.data
    } catch (error: any) {
      console.error(`Error fetching CID ${cid}:`, error)
      throw error
    }
  }

  const fetchAllRecords = async () => {
    if (!patientId || !walletAddress) return

    setLoading(true)
    setError('')
    setRecords([])

    try {
      const contract = blockchainUtils.getContract()
      
      // Fetch all private CIDs from blockchain - pass the patient's wallet address
      const privateCIDsResult: any = await contract.methods.viewAllMedicalRecords(patientId).call({ from: walletAddress })
      const privateCIDs: string[] = Array.isArray(privateCIDsResult) ? privateCIDsResult : []
      
      console.log('Private CIDs from blockchain:', privateCIDs)

      // Fetch public CIDs from MultiChain
      const multichainResponse = await fetch('/api/multichain/get-patient-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId }),
      })

      const multichainResult = await multichainResponse.json()
      console.log('MultiChain API response:', multichainResult)
      
      const publicCIDs = multichainResult.success ? multichainResult.cids : []
      
      console.log('Public CIDs from MultiChain:', publicCIDs)
      console.log('Number of public records:', publicCIDs.length)

      const allRecords: RecordData[] = []

      // Fetch data for private CIDs
      for (let i = 0; i < privateCIDs.length; i++) {
        const cid = privateCIDs[i]
        if (cid && cid.trim() !== '') {
          try {
            const data = await fetchFromIPFS(cid)
            allRecords.push({
              cid,
              data,
              timestamp: data.timestamp || new Date().toISOString(),
              source: 'private',
            })
          } catch (err: any) {
            allRecords.push({
              cid,
              data: null,
              timestamp: new Date().toISOString(),
              source: 'private',
              error: err.message || 'Failed to fetch data',
            })
          }
        }
      }

      // Fetch data for public CIDs
      console.log('Starting to fetch public IPFS data for', publicCIDs.length, 'CIDs')
      for (let i = 0; i < publicCIDs.length; i++) {
        const record = publicCIDs[i]
        console.log(`Fetching public record ${i + 1}/${publicCIDs.length}:`, record)
        try {
          const data = await fetchFromIPFS(record.cid)
          console.log(`Successfully fetched data for CID ${record.cid}:`, data)
          allRecords.push({
            cid: record.cid,
            data,
            timestamp: record.timestamp || new Date().toISOString(),
            source: 'public',
          })
        } catch (err: any) {
          console.error(`Failed to fetch data for CID ${record.cid}:`, err)
          allRecords.push({
            cid: record.cid,
            data: null,
            timestamp: record.timestamp || new Date().toISOString(),
            source: 'public',
            error: err.message || 'Failed to fetch data',
          })
        }
      }

      console.log('Total records before sorting:', allRecords.length)

      console.log('Total records before sorting:', allRecords.length)

      // Sort by timestamp (newest first)
      allRecords.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      console.log('Total records after sorting:', allRecords.length)
      console.log('All records:', allRecords)

      setRecords(allRecords)

      if (allRecords.length === 0) {
        setError('No medical records found')
      }
    } catch (err: any) {
      console.error('Error fetching records:', err)
      setError(err.message || 'Failed to fetch medical records')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString()
    } catch {
      return timestamp
    }
  }

  const renderRecordData = (data: any) => {
    if (!data) return <p className="text-gray-500">No data available</p>

    // Handle CSV data
    if (data.type === 'csv' && data.raw) {
      const csvLines = data.raw.split('\n').filter((line: string) => line.trim() !== '')
      
      return (
        <div className="space-y-2 text-sm">
          <div className="bg-gray-50 p-3 rounded border">
            <p className="font-semibold text-gray-700 mb-2">CSV Data:</p>
            {csvLines.map((line: string, idx: number) => (
              <div key={idx} className={`py-1 ${idx === 0 ? 'font-semibold border-b border-gray-300 pb-2' : ''}`}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Handle plain text data
    if (data.type === 'text' && data.raw) {
      return (
        <div className="bg-gray-50 p-3 rounded border">
          <pre className="text-sm whitespace-pre-wrap">{data.raw}</pre>
        </div>
      )
    }

    // Handle JSON object data
    return (
      <div className="space-y-2 text-sm">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="grid grid-cols-3 gap-2">
            <span className="font-semibold text-gray-700 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}:
            </span>
            <span className="col-span-2 text-gray-600 break-words">
              {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 bg-gradient-to-b from-green-50 to-green-100 min-h-screen">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-green-800">
              View Medical Records
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Patient ID: <span className="font-semibold">{patientId}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {!records.length && !loading && (
              <div className="text-center py-8">
                <Button
                  onClick={fetchAllRecords}
                  className="bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  Load All Medical Records
                </Button>
              </div>
            )}

            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <p className="mt-4 text-gray-600">Loading medical records...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {records.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Found {records.length} record(s)
                  </h3>
                  <Button
                    onClick={fetchAllRecords}
                    variant="outline"
                    size="sm"
                  >
                    Refresh
                  </Button>
                </div>

                {records.map((record, index) => (
                  <Card
                    key={`${record.cid}-${index}`}
                    className={`${
                      record.source === 'private'
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {record.source === 'private' ? '🔒 Private' : '🌐 Public'} Record
                          </CardTitle>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(record.timestamp)}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            record.source === 'private'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {record.source.toUpperCase()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 font-mono break-all">
                            CID: {record.cid}
                          </p>
                        </div>

                        {record.error ? (
                          <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded text-sm">
                            Error: {record.error}
                          </div>
                        ) : (
                          <div className="bg-white rounded p-4 border">
                            {renderRecordData(record.data)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}