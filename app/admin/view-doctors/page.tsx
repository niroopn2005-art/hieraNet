"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { blockchainUtils } from "@/utils/blockchain-utils"
import { useRouter } from "next/navigation"

interface Doctor {
  id: string
  walletAddress: string
  isRegistered: boolean
}

export default function ViewDoctorsPage() {
  const router = useRouter()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const contract = blockchainUtils.getContract()
        const events = await contract.getPastEvents("DoctorRegistered", {
          fromBlock: 0,
          toBlock: "latest",
        })

        const doctorsData = await Promise.all(
          events.map(async (event) => {
            const doctorId = event.returnValues.doctorId
            const details = await contract.methods.doctors(doctorId).call()

            return {
              id: doctorId,
              walletAddress: details.walletAddress,
              isRegistered: details.isRegistered,
            }
          })
        )

        setDoctors(doctorsData)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch doctors"
        )
        console.error("Error loading doctors:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDoctors()
  }, [])

  return (
    <Layout>
      <div className="container mx-auto p-6 bg-gradient-to-b from-red-50 to-red-100 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="ghost"
              asChild
              className="text-red-600 hover:text-red-700"
            >
              <Link href="/admin/dashboard">← Back to Dashboard</Link>
            </Button>
          </div>

          <Card className="bg-white border-red-200">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-red-800">
                Registered Doctors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">Loading doctors...</div>
              ) : error ? (
                <div className="text-red-600 text-center py-4">{error}</div>
              ) : doctors.length === 0 ? (
                <div className="text-center py-4">No doctors registered yet</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-red-800">Doctor ID</TableHead>
                      <TableHead className="text-red-800">Wallet Address</TableHead>
                      <TableHead className="text-red-800">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctors.map((doctor) => (
                      <TableRow key={doctor.id}>
                        <TableCell className="font-medium">{doctor.id}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {doctor.walletAddress}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-sm ${
                              doctor.isRegistered
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {doctor.isRegistered ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
