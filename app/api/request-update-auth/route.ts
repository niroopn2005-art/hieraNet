import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { patientId, doctorId, status } = await req.json()

    // Validate input
    if (!patientId || !doctorId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID and Doctor ID are required' },
        { status: 400 }
      )
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.accessRequest.findFirst({
      where: {
        patientId,
        doctorId,
        status: 'PENDING',
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: 'A pending request already exists' },
        { status: 400 }
      )
    }

    // Create access request record
    const accessRequest = await prisma.accessRequest.create({
      data: {
        patientId,
        doctorId,
        status: 'PENDING',
        requestedAt: new Date(),
      }
    })

    return NextResponse.json({ 
      success: true, 
      requestId: accessRequest.id,
      message: 'Access request created successfully'
    })

  } catch (error) {
    console.error('Error creating access request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create access request' },
      { status: 500 }
    )
  }
} 