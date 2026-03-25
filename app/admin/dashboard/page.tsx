"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, Users, Settings } from 'lucide-react'
import { blockchainUtils } from '@/utils/blockchain-utils'

export default function AdminDashboard() {
  const router = useRouter()

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        // Check session storage
        const isAdmin = sessionStorage.getItem('isAdmin')
        const storedAddress = sessionStorage.getItem('adminAddress')
        
        if (!isAdmin || !storedAddress) {
          throw new Error('Admin not authenticated')
        }

        // Verify against smart contract
        const contract = blockchainUtils.getContract()
        const adminAddress = await contract.methods.admin().call()

        if (storedAddress.toLowerCase() !== adminAddress.toLowerCase()) {
          throw new Error('Invalid admin address')
        }

        // Test blockchain connection
        const connectionTest = await blockchainUtils.testConnection()
        if (!connectionTest.success) {
          throw new Error('Lost blockchain connection')
        }

      } catch (error) {
        console.error('Admin verification failed:', error)
        sessionStorage.clear()
        router.push('/admin/login')
      }
    }

    verifyAdmin()
  }, [router])

  const handleRegisterDoctor = () => {
    router.push('/admin/register-doctor')
  }

  const handleViewDoctors = () => {
    router.push('/admin/view-doctors')
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 bg-gradient-to-b from-red-50 to-red-100 min-h-screen">
        <Card className="max-w-2xl mx-auto bg-white border-red-200">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-800">Admin Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer bg-red-50 border-red-100" 
              onClick={handleRegisterDoctor}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-red-800">Register Doctor</h3>
                    <p className="text-red-600 mt-2">Add new doctors to the system</p>
                  </div>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Register
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer bg-red-50 border-red-100"
              onClick={handleViewDoctors}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-red-800">View Doctors</h3>
                    <p className="text-red-600 mt-2">Manage registered doctors</p>
                  </div>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Users className="h-5 w-5 mr-2" />
                    View All
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-red-50 border-red-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-red-800">System Settings</h3>
                    <p className="text-red-600 mt-2">Configure system parameters</p>
                  </div>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Settings className="h-5 w-5 mr-2" />
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
