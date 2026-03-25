"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { blockchainUtils } from "@/utils/blockchain-utils"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

// IoT sensor reading interface
interface SensorReading {
  DiabetesPedigreeFunction?: number
  Insulin?: number
  BloodPressure?: number
  Glucose?: number
  POPCT?: number
  BPDIAS?: number
  BPSYS?: number
  RESPR?: number
  PULSE?: number
  TEMPF?: number
}

export default function UpdateRecords() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams?.get('patientId') || ''
  
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [recordType, setRecordType] = useState<'private' | 'public'>('private')
  const [csvData, setCsvData] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [patientWalletAddress, setPatientWalletAddress] = useState('')
  
  // IoT simulation states
  const [iotReading, setIotReading] = useState(false)
  const [iotData, setIotData] = useState<SensorReading[]>([])
  const [currentReading, setCurrentReading] = useState(0)
  const [averageData, setAverageData] = useState<SensorReading | null>(null)
  const [showingAverage, setShowingAverage] = useState(false)

  useEffect(() => {
    const storedDoctorId = sessionStorage.getItem('doctorId')
    const storedWallet = sessionStorage.getItem('doctorWallet')
    
    if (!storedDoctorId || !storedWallet || !patientId) {
      alert('Authentication error. Please login again.')
      router.push('/doctor/login')
      return
    }

    setDoctorId(storedDoctorId)
    setWalletAddress(storedWallet)
    checkUpdateAccess(patientId, storedDoctorId)
  }, [patientId, router])

  const checkUpdateAccess = async (pid: string, did: string) => {
    try {
      setCheckingAccess(true)
      const contract = blockchainUtils.getContract()
      
      // Get patient info (includes wallet address)
      const patientInfo: any = await contract.methods.patients(pid).call()
      if (patientInfo && patientInfo.walletAddress) {
        setPatientWalletAddress(patientInfo.walletAddress)
        console.log('Patient wallet address:', patientInfo.walletAddress)
      }
      
      // Check if doctor has update access on the blockchain
      const access = await contract.methods.checkUpdateAccess(pid, did).call()
      
      console.log(`Doctor ${did} update access for patient ${pid}:`, access)
      
      if (!access) {
        // Redirect to access request page
        router.push(`/doctor/access-request?patientId=${pid}&type=UPDATE`)
        return
      }
      
      setHasAccess(true)
    } catch (err: any) {
      console.error('Error checking access:', err)
      alert(`Failed to check access: ${err.message}`)
      router.push('/doctor/dashboard')
    } finally {
      setCheckingAccess(false)
    }
  }

  // IoT Simulation: Start reading sensors
  const startIoTReading = async () => {
    try {
      setIotReading(true)
      setCurrentReading(0)
      setAverageData(null)
      setShowingAverage(false)

      console.log('📡 Starting IoT sensor reading simulation...')

      // Fetch sensor data from API
      const response = await fetch('/api/iot/read-sensors')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to read sensor data')
      }

      const sensorData: SensorReading[] = result.data
      setIotData(sensorData)

      console.log(`📊 Received ${sensorData.length} sensor readings`)

      // Display readings one by one (each reading for ~240ms to complete 25 in 6 seconds)
      const displayInterval = 6000 / sensorData.length // 6 seconds / 25 readings = 240ms each

      for (let i = 0; i < sensorData.length; i++) {
        await new Promise(resolve => setTimeout(resolve, displayInterval))
        setCurrentReading(i + 1)
        console.log(`📈 Reading ${i + 1}/${sensorData.length}:`, sensorData[i])
      }

      // Calculate averages
      console.log('🧮 Calculating averages from all readings...')
      const avg = calculateAverage(sensorData)
      setAverageData(avg)
      setShowingAverage(true)

      // Generate CSV from average data
      const csvContent = convertAverageToCSV(avg)
      setCsvData(csvContent)

      console.log('✅ IoT reading complete. Average values:', avg)

      // Show average for 6 seconds
      await new Promise(resolve => setTimeout(resolve, 6000))
      setShowingAverage(false)
      
    } catch (error: any) {
      console.error('❌ IoT reading error:', error)
      alert(`IoT Reading Failed: ${error.message}`)
    } finally {
      setIotReading(false)
    }
  }

  // Calculate average of all sensor readings
  const calculateAverage = (readings: SensorReading[]): SensorReading => {
    const avg: any = {}
    const fields = [
      'DiabetesPedigreeFunction', 'Insulin', 'BloodPressure', 'Glucose',
      'POPCT', 'BPDIAS', 'BPSYS', 'RESPR', 'PULSE', 'TEMPF'
    ]

    fields.forEach(field => {
      const values = readings
        .map(r => r[field as keyof SensorReading])
        .filter(v => v !== undefined && v !== null)
      
      if (values.length > 0) {
        const sum = values.reduce((acc, val) => acc + (val as number), 0)
        avg[field] = parseFloat((sum / values.length).toFixed(2))
      }
    })

    return avg
  }

  // Convert average data to CSV format
  const convertAverageToCSV = (avg: SensorReading): string => {
    const headers = Object.keys(avg).join(',')
    const values = Object.values(avg).join(',')
    return `${headers}\n${values}`
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        setCsvData(content)
      }
      reader.readAsText(file)
    }
  }

  const handleSubmit = async () => {
    if (!csvData.trim()) {
      alert('Please enter or upload CSV data')
      return
    }

    if (!confirm(`Are you sure you want to add a new ${recordType} record for patient ${patientId}?`)) {
      return
    }

    setLoading(true)

    try {
      // Step 1: Upload data to IPFS (with encryption)
      console.log('🔐 Encrypting and uploading data to IPFS...')
      const ipfsResponse = await fetch('/api/ipfs/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: csvData,
          fileName: `${patientId}_${recordType}_${Date.now()}.csv`,
          walletAddress: patientWalletAddress,  // Use patient's wallet, not doctor's
          patientId: patientId,
          encrypt: true  // Enable encryption
        })
      })

      const ipfsResult = await ipfsResponse.json()
      
      if (!ipfsResult.success) {
        throw new Error(ipfsResult.error || 'Failed to upload to IPFS')
      }

      const cid = ipfsResult.cid
      console.log('IPFS Upload successful. CID:', cid)
      console.log('Data encrypted:', ipfsResult.encrypted)

      if (recordType === 'private') {
        // Step 2a: Store private CID on Ethereum blockchain
        console.log('Storing private CID on Ethereum blockchain...')
        const contract = blockchainUtils.getContract()
        
        await contract.methods.updateMedicalRecord(patientId, cid).send({
          from: walletAddress,
          gas: '500000'
        })
        
        console.log('Private record updated on Ethereum successfully')
        alert(`Private medical record updated successfully!\n\nCID: ${cid}`)
      } else {
        // Step 2b: Store public CID on MultiChain
        console.log('Storing public CID on MultiChain...')
        const multichainResponse = await fetch('/api/multichain/publish-record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId,
            cid,
            timestamp: new Date().toISOString()
          })
        })

        const multichainResult = await multichainResponse.json()
        
        if (!multichainResult.success) {
          throw new Error(multichainResult.error || 'Failed to publish to MultiChain')
        }

        console.log('Public record published to MultiChain successfully')
        alert(`Public medical record updated successfully!\n\nCID: ${cid}\nTxID: ${multichainResult.txid || 'N/A'}`)
      }

      // Clear form
      setCsvData('')
      
    } catch (error: any) {
      console.error('Error updating record:', error)
      alert(`Failed to update record: ${error.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (checkingAccess) {
    return (
      <Layout>
        <div className="container mx-auto p-6 bg-gradient-to-b from-blue-50 to-blue-100 min-h-screen">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Checking access permissions...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  if (!hasAccess) {
    return null // Will redirect
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 bg-gradient-to-b from-blue-50 to-blue-100 min-h-screen">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-800">
              📝 Update Patient Records - {patientId}
            </CardTitle>
            <p className="text-gray-600 text-sm mt-2">
              Doctor ID: {doctorId}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Record Type Selection */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Record Type</Label>
              <div className="flex gap-4">
                <button
                  onClick={() => setRecordType('private')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    recordType === 'private'
                      ? 'border-blue-600 bg-blue-50 text-blue-800'
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <div className="text-2xl mb-2">🔒</div>
                  <div className="font-semibold">Private Record</div>
                  <div className="text-xs text-gray-600 mt-1">Stored on Ethereum</div>
                </button>
                
                <button
                  onClick={() => setRecordType('public')}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    recordType === 'public'
                      ? 'border-green-600 bg-green-50 text-green-800'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  <div className="text-2xl mb-2">🌐</div>
                  <div className="font-semibold">Public Record</div>
                  <div className="text-xs text-gray-600 mt-1">Stored on MultiChain</div>
                </button>
              </div>
            </div>

            {/* File Upload or Manual Entry (Private Records Only) */}
            {recordType === 'private' && (
              <>
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Upload CSV File (Optional)</Label>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {/* CSV Data Input */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">CSV Data</Label>
                  <Textarea
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    placeholder="Enter CSV data here or upload a file above...&#10;&#10;Example:&#10;Name,Age,Diagnosis&#10;John Doe,45,Hypertension&#10;Jane Smith,32,Diabetes"
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Enter medical data in CSV format. This will be stored on IPFS and the CID will be recorded on the blockchain.
                  </p>
                </div>
              </>
            )}

            {/* IoT Simulation (Public Records Only) */}
            {recordType === 'public' && (
              <div className="space-y-4">
                {/* IoT Reading Button */}
                {!iotReading && !csvData && (
                  <div className="text-center py-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-dashed border-green-300">
                    <div className="text-6xl mb-4">📡</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">IoT Medical Sensors</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Simulate reading data from connected medical IoT devices. 
                      The system will collect 25 sensor readings and calculate average values.
                    </p>
                    <Button
                      onClick={startIoTReading}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
                    >
                      🚀 Start IoT Sensor Reading
                    </Button>
                  </div>
                )}

                {/* IoT Reading in Progress */}
                {iotReading && (
                  <div className="bg-gray-900 text-white p-6 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">📡 IoT Sensors Active</h3>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm">Collecting Data...</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${(currentReading / 25) * 100}%` }}
                      ></div>
                    </div>

                    <div className="text-center text-2xl font-mono font-bold">
                      {currentReading} / 25 Readings
                    </div>

                    {/* Current Reading Display */}
                    {currentReading > 0 && iotData[currentReading - 1] && !showingAverage && (
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {Object.entries(iotData[currentReading - 1]).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-400">{key}:</span>
                              <span className="font-mono text-green-400">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Average Display */}
                    {showingAverage && averageData && (
                      <div className="bg-gradient-to-r from-green-900 to-blue-900 p-6 rounded-lg border-2 border-green-400">
                        <h4 className="text-xl font-bold mb-4 text-green-300">✅ Average Values (25 Readings)</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(averageData).map(([key, value]) => (
                            <div key={key} className="bg-gray-800 p-3 rounded">
                              <div className="text-xs text-gray-400 mb-1">{key}</div>
                              <div className="text-lg font-mono font-bold text-green-400">{value}</div>
                            </div>
                          ))}
                        </div>
                        <p className="text-center text-sm text-gray-300 mt-4">
                          Displaying for 6 seconds...
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* CSV Data Preview (After IoT Reading) */}
                {csvData && !iotReading && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-semibold">Generated CSV Data (From IoT Sensors)</Label>
                      <Button
                        onClick={startIoTReading}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        🔄 Re-scan Sensors
                      </Button>
                    </div>
                    <Textarea
                      value={csvData}
                      onChange={(e) => setCsvData(e.target.value)}
                      className="min-h-[150px] font-mono text-sm bg-green-50"
                      readOnly
                    />
                    <p className="text-xs text-gray-500">
                      ✅ IoT sensor data collected and averaged. Ready to submit to blockchain.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={handleSubmit}
                className={`flex-1 ${
                  recordType === 'private'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
                disabled={loading || !csvData.trim()}
              >
                {loading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  `Submit ${recordType === 'private' ? 'Private' : 'Public'} Record`
                )}
              </Button>
              
              <Button
                onClick={() => router.push('/doctor/dashboard')}
                variant="outline"
                disabled={loading}
              >
                Cancel
              </Button>
            </div>

            {/* Info Box */}
            <div className={`p-4 rounded-lg ${
              recordType === 'private'
                ? 'bg-blue-50 border border-blue-200'
                : 'bg-green-50 border border-green-200'
            }`}>
              <p className="text-sm font-semibold mb-2">
                {recordType === 'private' ? '🔒 Private Record' : '🌐 Public Record'}
              </p>
              <ul className="text-xs space-y-1 text-gray-700">
                <li>• Data will be uploaded to IPFS (InterPlanetary File System)</li>
                <li>• CID (Content Identifier) will be stored on {recordType === 'private' ? 'Ethereum blockchain' : 'MultiChain'}</li>
                <li>• {recordType === 'private' ? 'Only authorized doctors can access' : 'Publicly accessible record'}</li>
                <li>• Immutable and tamper-proof</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
