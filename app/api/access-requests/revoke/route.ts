import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Request ID is required' 
      }, { status: 400 })
    }

    const updatedRequest = await prisma.accessRequest.update({
      where: { id: requestId },
      data: {
        status: 'REVOKED',
        respondedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      request: updatedRequest 
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error revoking access:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to revoke access' 
    }, { status: 500 })
  }
} 