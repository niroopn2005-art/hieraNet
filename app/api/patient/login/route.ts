import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { id, password } = await request.json()
    
    // Debug log
    console.log('Login attempt with:', { id, password })

    if (!id || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID and password are required' 
      })
    }

    // Find the patient and log the result
    const patient = await prisma.patient.findFirst({
      where: {
        id: id
      }
    })
    
    // Debug log
    console.log('Found patient:', patient)

    if (!patient) {
      return NextResponse.json({ 
        success: false, 
        error: 'Patient not found' 
      })
    }

    if (patient.password !== password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid password' 
      })
    }

    return NextResponse.json({ 
      success: true, 
      id: patient.id 
    })

  } catch (error) {
    // Log the actual error
    console.error('Login error:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: 'Login failed - ' + (error as Error).message 
    })
  } finally {
    await prisma.$disconnect()
  }
} 