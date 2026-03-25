import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { patientId, cid, timestamp } = await request.json()

    if (!patientId || !cid) {
      return NextResponse.json(
        { success: false, error: 'PatientId and CID are required' },
        { status: 400 }
      )
    }

    // Build RPC URL from env variables
    const host = process.env.NEXT_PUBLIC_MULTICHAIN_HOST || 'localhost'
    const port = process.env.NEXT_PUBLIC_MULTICHAIN_PORT || '6834'
    const rpcUrl = `http://${host}:${port}`
    const username = process.env.NEXT_PUBLIC_MULTICHAIN_USER || 'multichainrpc'
    const password = process.env.NEXT_PUBLIC_MULTICHAIN_PASS || ''
    const streamName = 'medical_records'

    console.log('MultiChain Config:', { rpcUrl, username, streamName })

    // Create key with patient ID and timestamp
    const key = `${patientId}_${timestamp || new Date().toISOString()}`

    // Create JSON object with CID and timestamp (matching the read format)
    const dataObject = {
      cid: cid,
      timestamp: timestamp || new Date().toISOString(),
      patientId: patientId
    }
    
    // Convert JSON to hexadecimal format (required by MultiChain)
    const hexData = Buffer.from(JSON.stringify(dataObject)).toString('hex')
    
    console.log('Publishing to MultiChain:', { key, dataObject, hexData })

    // Create Basic Auth header
    const auth = Buffer.from(`${username}:${password}`).toString('base64')

    // Publish to MultiChain stream
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        method: 'publish',
        params: [streamName, key, hexData],
        id: 1
      })
    })

    console.log('MultiChain Response Status:', response.status)
    
    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text()
      console.error('MultiChain Error Response:', errorText)
      throw new Error(`MultiChain RPC error: ${response.status} - ${errorText}`)
    }

    // Try to parse response
    const responseText = await response.text()
    console.log('MultiChain Response:', responseText)
    
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse MultiChain response:', responseText)
      throw new Error(`Invalid JSON response from MultiChain: ${responseText.substring(0, 100)}`)
    }

    if (data.error) {
      throw new Error(data.error.message || 'MultiChain publish failed')
    }

    console.log('MultiChain Publish Result:', data)

    return NextResponse.json({
      success: true,
      txid: data.result,
      key,
      cid
    })
  } catch (error: any) {
    console.error('MultiChain Publish Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to publish to MultiChain' },
      { status: 500 }
    )
  }
}
