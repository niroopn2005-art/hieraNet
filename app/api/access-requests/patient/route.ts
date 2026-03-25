import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const status = searchParams.get('status') || 'PENDING'

    if (!patientId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Patient ID is required' 
      }, { status: 400 })
    }

    const requests = await prisma.accessRequest.findMany({
      where: {
        patientId,
        status
      },
      orderBy: {
        requestedAt: 'desc'
      }
    })

    return NextResponse.json({ 
      success: true, 
      requests 
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error fetching requests:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch requests' 
    }, { status: 500 })
  }
} 