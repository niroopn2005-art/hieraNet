import { NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cid = searchParams.get('cid')

    if (!cid) {
      return NextResponse.json({ success: false, error: 'No CID provided' })
    }

    // Fetch from Pinata gateway
    const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${cid}`)
    
    if (response.status === 200) {
      return NextResponse.json({ success: true, data: response.data })
    } else {
      throw new Error('Failed to fetch from IPFS')
    }

  } catch (error) {
    console.error('Error fetching from IPFS:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch from IPFS' },
      { status: 500 }
    )
  }
} 