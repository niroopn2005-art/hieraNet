"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface PublicRecord {
  TEMPF: string
  PULSE: string
  RESPR: string
  BPSYS: string
  BPDIAS: string
  POPCT: string
  SCORE: string
  BloodPressure: string
  Insulin: string
  Height: string
  Weight: string
  Bmi: string
  BmiClass: string
}

export default function UpdatePublicRecords() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const patientId = searchParams?.get('patientId') || ''
  
  const [formData, setFormData] = useState<PublicRecord>({
    TEMPF: "",
    PULSE: "",
    RESPR: "",
    BPSYS: "",
    BPDIAS: "",
    POPCT: "",
    SCORE: "",
    BloodPressure: "",
    Insulin: "",
    Height: "",
    Weight: "",
    Bmi: "",
    BmiClass: ""
  })

  const [showCidInput, setShowCidInput] = useState(false)
  const [previousCid, setPreviousCid] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: keyof PublicRecord, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const calculateBMI = () => {
    if (formData.Height && formData.Weight) {
      const height = parseFloat(formData.Height)
      const weight = parseFloat(formData.Weight)
      if (height && weight) {
        const bmi = weight / ((height / 100) * (height / 100))
        const bmiClass = getBmiClass(bmi)
        setFormData(prev => ({
          ...prev,
          Bmi: bmi.toFixed(2),
          BmiClass: bmiClass
        }))
      }
    }
  }

  const getBmiClass = (bmi: number): string => {
    if (bmi < 18.5) return "Underweight"
    if (bmi < 25) return "Normal"
    if (bmi < 30) return "Overweight"
    return "Obese"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

      // Add new record as a new row (append)
      const newRow = `${currentTime},${formData.TEMPF},${formData.PULSE},${formData.RESPR},${formData.BPSYS},${formData.BPDIAS},${formData.POPCT},${formData.SCORE},${formData.BloodPressure},${formData.Insulin},${formData.Height},${formData.Weight},${formData.Bmi},${formData.BmiClass}`
      
      // Combine existing rows with new row
      const updatedRows = [...rows, newRow]

      // Create final CSV content
      const csvData = updatedRows.join('\n')

      // Upload to IPFS
      const uploadData = new FormData()
      const blob = new Blob([csvData], { type: 'text/csv' })
      uploadData.append('file', blob, 'records.csv')

      const response = await fetch('/api/upload-file', {
          method: 'POST',
          body: uploadData,
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

  return (
    <Layout>
      <div className="container mx-auto p-6 bg-gradient-to-b from-blue-50 to-blue-100 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-blue-800">Update Public Records</h1>
            <Button variant="outline" onClick={() => router.push('/doctor/update-options')}>
              ← Back
            </Button>
          </div>

          {!showCidInput ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-800">Medical Records Form</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label>Temperature (°F)</label>
                      <Input
                        type="number"
                        value={formData.TEMPF}
                        onChange={(e) => handleInputChange('TEMPF', e.target.value)}
                        placeholder="Temperature"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label>Pulse Rate</label>
                      <Input
                        type="number"
                        value={formData.PULSE}
                        onChange={(e) => handleInputChange('PULSE', e.target.value)}
                        placeholder="Pulse Rate"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label>Respiratory Rate</label>
                      <Input
                        type="number"
                        value={formData.RESPR}
                        onChange={(e) => handleInputChange('RESPR', e.target.value)}
                        placeholder="Respiratory Rate"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label>Blood Pressure (Systolic)</label>
                      <Input
                        type="number"
                        value={formData.BPSYS}
                        onChange={(e) => handleInputChange('BPSYS', e.target.value)}
                        placeholder="Systolic BP"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label>Blood Pressure (Diastolic)</label>
                      <Input
                        type="number"
                        value={formData.BPDIAS}
                        onChange={(e) => handleInputChange('BPDIAS', e.target.value)}
                        placeholder="Diastolic BP"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label>Oxygen Saturation (%)</label>
                      <Input
                        type="number"
                        value={formData.POPCT}
                        onChange={(e) => handleInputChange('POPCT', e.target.value)}
                        placeholder="Oxygen Saturation"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label>Health Score</label>
                      <Input
                        type="number"
                        value={formData.SCORE}
                        onChange={(e) => handleInputChange('SCORE', e.target.value)}
                        placeholder="Health Score"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label>Blood Pressure Category</label>
                      <Input
                        value={formData.BloodPressure}
                        onChange={(e) => handleInputChange('BloodPressure', e.target.value)}
                        placeholder="Blood Pressure Category"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label>Insulin Level</label>
                      <Input
                        type="number"
                        value={formData.Insulin}
                        onChange={(e) => handleInputChange('Insulin', e.target.value)}
                        placeholder="Insulin Level"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label>Height (cm)</label>
                      <Input
                        type="number"
                        value={formData.Height}
                        onChange={(e) => {
                          handleInputChange('Height', e.target.value)
                          calculateBMI()
                        }}
                        placeholder="Height in cm"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label>Weight (kg)</label>
                      <Input
                        type="number"
                        value={formData.Weight}
                        onChange={(e) => {
                          handleInputChange('Weight', e.target.value)
                          calculateBMI()
                        }}
                        placeholder="Weight in kg"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label>BMI</label>
                      <Input
                        value={formData.Bmi}
                        readOnly
                        placeholder="Calculated BMI"
                      />
                    </div>

                    <div className="space-y-2">
                      <label>BMI Classification</label>
                      <Input
                        value={formData.BmiClass}
                        readOnly
                        placeholder="BMI Classification"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Submit Records
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
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
                      Back to Form
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  )
}
