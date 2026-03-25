import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const doctorId = searchParams.get('doctorId')

    if (!patientId || !doctorId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID and Doctor ID are required' },
        { status: 400 }
      )
    }

    const existingRequest = await prisma.accessRequest.findFirst({
      where: {
        patientId: patientId,
        doctorId: doctorId,
        status: {
          in: ['APPROVED', 'PENDING']
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      hasAccess: existingRequest?.status === 'APPROVED',
      hasPendingRequest: existingRequest?.status === 'PENDING'
    })
  } catch (error) {
    console.error('Error checking existing request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check existing request' },
      { status: 500 }
    )
  }
} 