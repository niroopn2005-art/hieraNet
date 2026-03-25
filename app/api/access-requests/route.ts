import { NextResponse } from 'next/server'

// In-memory storage for access requests (resets on server restart)
// Using a Map instead of array for better persistence
const accessRequestsMap = new Map<string, any>()

// Helper to generate unique key
function getRequestKey(doctorId: string, patientId: string, accessType: string) {
  return `${doctorId}_${patientId}_${accessType}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Received access request:', body)

    const { doctorId, patientId, accessType } = body

    // Validate inputs
    if (!doctorId || !patientId || !accessType) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // Generate unique key
    const requestKey = getRequestKey(doctorId, patientId, accessType)
    
    // Check if request already exists
    const existingRequest = accessRequestsMap.get(requestKey)

    if (existingRequest && existingRequest.status === 'PENDING') {
      console.log('Request already exists:', existingRequest)
      return NextResponse.json({ 
        success: true, 
        request: existingRequest,
        message: 'Request already exists'
      }, { status: 200 })
    }

    // Create new request
    const newRequest = {
      id: Date.now().toString(),
      doctorId,
      patientId,
      accessType,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    }

    accessRequestsMap.set(requestKey, newRequest)
    console.log('Created access request:', newRequest)
    console.log('Total requests in map:', accessRequestsMap.size)

    return NextResponse.json({ 
      success: true, 
      request: newRequest 
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error in access request:', error.message)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to create request' 
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const doctorId = searchParams.get('doctorId')
  const patientId = searchParams.get('patientId')
  const status = searchParams.get('status')

  try {
    // Convert Map to array
    let filteredRequests = Array.from(accessRequestsMap.values())

    if (doctorId) {
      filteredRequests = filteredRequests.filter((r: any) => r.doctorId === doctorId)
    }
    if (patientId) {
      filteredRequests = filteredRequests.filter((r: any) => r.patientId === patientId)
    }
    if (status) {
      filteredRequests = filteredRequests.filter((r: any) => r.status === status)
    }

    // Sort by creation date (newest first)
    filteredRequests.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    console.log(`GET requests - doctorId: ${doctorId}, patientId: ${patientId}, found: ${filteredRequests.length}`)

    return NextResponse.json({ success: true, requests: filteredRequests })
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch requests' 
    }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { requestId, status } = await request.json()

    if (!requestId || !status) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Find the request by ID
    let found = null
    accessRequestsMap.forEach((req, key) => {
      if (req.id === requestId) {
        req.status = status
        req.updatedAt = new Date().toISOString()
        accessRequestsMap.set(key, req)
        found = req
      }
    })
    
    if (!found) {
      return NextResponse.json({
        success: false,
        error: 'Request not found'
      }, { status: 404 })
    }

    console.log('Updated access request:', found)

    return NextResponse.json({
      success: true,
      request: found
    })
  } catch (error: any) {
    console.error('Error updating request:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update request'
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json({
        success: false,
        error: 'Missing request ID'
      }, { status: 400 })
    }

    // Remove the request by finding and deleting the key
    let deleted = false
    accessRequestsMap.forEach((req, key) => {
      if (req.id === requestId) {
        accessRequestsMap.delete(key)
        deleted = true
      }
    })

    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Request not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Request deleted'
    })
  } catch (error: any) {
    console.error('Error deleting request:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete request'
    }, { status: 500 })
  }
}
 