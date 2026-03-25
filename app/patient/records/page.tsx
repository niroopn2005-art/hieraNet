"use client"

import { useState } from "react"
import { Layout } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRightIcon } from 'lucide-react'
import { FullScreenModal } from "@/components/full-screen-modal"

export default function PatientRecordsPage() {
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null)

  const records = [
    { id: "1", title: "General Information", data: { name: "John Doe", age: 32, gender: "Male", bloodType: "O+" } },
    { id: "2", title: "Vital Signs", data: { bloodPressure: "120/80 mmHg", heartRate: "72 bpm", bloodSugar: "95 mg/dL", oxygenLevel: "98%" } },
    { id: "3", title: "Medications", data: { current: ["Lisinopril", "Metformin"], allergies: ["Penicillin"] } },
    { id: "4", title: "Recent Lab Results", data: { cholesterol: "180 mg/dL", hba1c: "5.7%", vitaminD: "30 ng/mL" } },
  ]

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-4">
        <h1 className="mb-6 text-2xl font-bold text-purple-800">My Health Records</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {records.map((record) => (
            <Card key={record.id} className="bg-white bg-opacity-50 hover:bg-opacity-70 transition-all duration-300 shadow-md hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">{record.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRecord(record.id)}
                  className="text-purple-600 hover:text-purple-800"
                >
                  View <ChevronRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{Object.keys(record.data).length} items</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <FullScreenModal
          record={records.find(r => r.id === selectedRecord)}
          onClose={() => setSelectedRecord(null)}
        />
      </div>
    </Layout>
  )
}

