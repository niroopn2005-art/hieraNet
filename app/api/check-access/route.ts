import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const doctorId = searchParams.get('doctorId')
    const accessType = searchParams.get('accessType')

    console.log('Checking access for:', { doctorId, patientId, accessType }) // Debug log

    if (!patientId || !doctorId || !accessType) {
      return NextResponse.json(
        { success: false, error: 'Patient ID, Doctor ID, and Access Type are required' },
        { status: 400 }
      )
    }

    // Check for specific doctor's approved access
    const accessRequest = await prisma.accessRequest.findFirst({
      where: {
        patientId: patientId,
        doctorId: doctorId,
        accessType: accessType,
        status: 'APPROVED'
      },
      orderBy: {
        respondedAt: 'desc'
      }
    })

    console.log('Found access request:', accessRequest) // Debug log

    const hasAccess = !!accessRequest
    console.log('Has access:', hasAccess) // Debug log

    return NextResponse.json({
      success: true,
      hasAccess: hasAccess
    })
  } catch (error) {
    console.error('Error checking access:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check access' },
      { status: 500 }
    )
  }
} 