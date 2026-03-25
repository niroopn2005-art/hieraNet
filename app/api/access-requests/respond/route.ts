import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Received response:', body) // Debug log

    const { requestId, status } = body

    if (!requestId || !status) {
      return NextResponse.json({ 
        success: false, 
        error: 'Request ID and status are required' 
      }, { status: 400 })
    }

    const updatedRequest = await prisma.accessRequest.update({
      where: { id: requestId },
      data: {
        status,
        respondedAt: new Date()
      }
    })

    console.log('Updated request:', updatedRequest) // Debug log

    return NextResponse.json({ 
      success: true, 
      request: updatedRequest 
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error in respond:', error.message)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to update request' 
    }, { status: 500 })
  }
} 