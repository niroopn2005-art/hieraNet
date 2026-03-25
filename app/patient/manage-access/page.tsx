"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Layout } from "@/components/layout"
import { blockchainUtils } from "@/utils/blockchain-utils"

interface AccessRequest {
  id: string
  doctorId: string
  accessType: 'VIEW' | 'UPDATE'
  status: string
  createdAt: string
}

export default function ManageAccess() {
  const router = useRouter()
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [approvedRequests, setApprovedRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [patientId, setPatientId] = useState('')
  const [walletAddress, setWalletAddress] = useState('')

  useEffect(() => {
    const storedPatientId = sessionStorage.getItem('patientId')
    const storedWallet = sessionStorage.getItem('walletAddress')
    
    if (!storedPatientId || !storedWallet) {
      router.push('/patient/login')
    } else {
      setPatientId(storedPatientId)
      setWalletAddress(storedWallet)
      fetchRequests(storedPatientId)
      
      // Auto-refresh every 5 seconds to check for new requests
      const interval = setInterval(() => {
        fetchRequests(storedPatientId)
      }, 5000)
      
      // Cleanup interval on unmount
      return () => clearInterval(interval)
    }
  }, [router])

  const fetchRequests = async (pid: string) => {
    try {
      setLoading(true)
      
      // Fetch all requests for this patient
      const response = await fetch(`/api/access-requests?patientId=${pid}`)
      const data = await response.json()
      
      if (data.success) {
        // Separate pending and approved requests
        const pending = data.requests.filter((r: AccessRequest) => r.status === 'PENDING')
        const approved = data.requests.filter((r: AccessRequest) => r.status === 'APPROVED')
        
        setRequests(pending)
        setApprovedRequests(approved)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (request: AccessRequest) => {
    setProcessing(request.id)
    try {
      const contract = blockchainUtils.getContract()
      
      // Determine which access to grant
      const canView = request.accessType === 'VIEW' || request.accessType === 'UPDATE'
      const canUpdate = request.accessType === 'UPDATE'
      
      console.log(`Granting access to doctor ${request.doctorId}: view=${canView}, update=${canUpdate}`)
      
      // Call smart contract grantAccess method
      await contract.methods.grantAccess(request.doctorId, canView, canUpdate).send({ 
        from: walletAddress,
        gas: '500000' 
      })
      
      console.log('Access granted on blockchain')
      
      // Update request status in database
      const response = await fetch('/api/access-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request.id,
          status: 'APPROVED'
        }),
      })

      const data = await response.json()
      if (data.success) {
        alert(`Access granted to Doctor ${request.doctorId}`)
        fetchRequests(patientId) // Refresh the list
      }
    } catch (error: any) {
      console.error('Error granting access:', error)
      alert(`Failed to grant access: ${error.message || 'Unknown error'}`)
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (request: AccessRequest) => {
    setProcessing(request.id)
    try {
      // Update request status in database (no blockchain call needed for rejection)
      const response = await fetch('/api/access-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request.id,
          status: 'REJECTED'
        }),
      })

      const data = await response.json()
      if (data.success) {
        alert(`Access request rejected`)
        fetchRequests(patientId) // Refresh the list
      }
    } catch (error: any) {
      console.error('Error rejecting request:', error)
      alert(`Failed to reject request: ${error.message || 'Unknown error'}`)
    } finally {
      setProcessing(null)
    }
  }

  const handleRevoke = async (request: AccessRequest) => {
    setProcessing(request.id)
    try {
      const contract = blockchainUtils.getContract()
      
      console.log(`Revoking access from doctor ${request.doctorId}`)
      
      // Call smart contract revokeAccess method
      await contract.methods.revokeAccess(request.doctorId).send({ 
        from: walletAddress,
        gas: '500000' 
      })
      
      console.log('Access revoked on blockchain')
      
      // Update request status in database
      const response = await fetch('/api/access-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request.id,
          status: 'REVOKED'
        }),
      })

      const data = await response.json()
      if (data.success) {
        alert(`Access revoked from Doctor ${request.doctorId}`)
        fetchRequests(patientId) // Refresh the list
      }
    } catch (error: any) {
      console.error('Error revoking access:', error)
      alert(`Failed to revoke access: ${error.message || 'Unknown error'}`)
    } finally {
      setProcessing(null)
    }
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 bg-gradient-to-b from-green-50 to-green-100 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header with Refresh Button */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-green-800">Manage Access Requests</h1>
            <Button 
              onClick={() => fetchRequests(patientId)}
              variant="outline"
              disabled={loading}
            >
              {loading ? '🔄 Loading...' : '🔄 Refresh'}
            </Button>
          </div>

          {/* Pending Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-green-800">
                📬 Pending Access Requests ({requests.length})
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Auto-refreshes every 5 seconds
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                  <p className="mt-4 text-gray-600">Loading requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">No pending access requests</p>
                  <p className="text-sm mt-2">Doctors can request access to view or update your records</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <Card key={request.id} className="border-l-4 border-l-yellow-400 bg-yellow-50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-semibold text-lg">🩺 Doctor ID: {request.doctorId}</p>
                            <p className="text-gray-700 mt-1">
                              <span className="font-medium">Access Type:</span>{' '}
                              <span className={`px-2 py-1 rounded text-sm ${
                                request.accessType === 'UPDATE' 
                                  ? 'bg-orange-100 text-orange-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {request.accessType}
                              </span>
                            </p>
                            <p className="text-gray-600 text-sm mt-1">
                              Requested: {new Date(request.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApprove(request)}
                              className="bg-green-600 hover:bg-green-700"
                              disabled={processing === request.id}
                            >
                              {processing === request.id ? 'Processing...' : '✓ Approve'}
                            </Button>
                            <Button
                              onClick={() => handleReject(request)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={processing === request.id}
                            >
                              {processing === request.id ? 'Processing...' : '✗ Reject'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approved Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-green-800">
                ✅ Active Access Permissions ({approvedRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                  <p className="mt-4 text-gray-600">Loading...</p>
                </div>
              ) : approvedRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">No active access permissions</p>
                  <p className="text-sm mt-2">You haven't granted access to any doctors yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvedRequests.map((request) => (
                    <Card key={request.id} className="border-l-4 border-l-green-400 bg-green-50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-semibold text-lg">🩺 Doctor ID: {request.doctorId}</p>
                            <p className="text-gray-700 mt-1">
                              <span className="font-medium">Access Type:</span>{' '}
                              <span className={`px-2 py-1 rounded text-sm ${
                                request.accessType === 'UPDATE' 
                                  ? 'bg-orange-100 text-orange-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {request.accessType}
                              </span>
                            </p>
                            <p className="text-gray-600 text-sm mt-1">
                              Granted: {new Date(request.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleRevoke(request)}
                            className="bg-yellow-600 hover:bg-yellow-700"
                            disabled={processing === request.id}
                          >
                            {processing === request.id ? 'Revoking...' : '🚫 Revoke Access'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="text-center">
            <Button
              onClick={() => router.push('/patient/dashboard')}
              variant="outline"
              className="border-green-600 text-green-700 hover:bg-green-50"
            >
              ← Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  )
} 