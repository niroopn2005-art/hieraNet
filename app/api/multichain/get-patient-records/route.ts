import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { patientId } = await req.json()

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 })
    }

    const multichainPort = process.env.NEXT_PUBLIC_MULTICHAIN_PORT || '6834'
    const multichainHost = process.env.NEXT_PUBLIC_MULTICHAIN_HOST || 'localhost'
    const multichainUser = process.env.NEXT_PUBLIC_MULTICHAIN_USER || 'multichainrpc'
    const multichainPass = process.env.NEXT_PUBLIC_MULTICHAIN_PASS || ''

    // Call MultiChain RPC - use basic auth header instead of URL credentials
    const rpcUrl = `http://${multichainHost}:${multichainPort}`
    const auth = Buffer.from(`${multichainUser}:${multichainPass}`).toString('base64')
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        method: 'liststreamitems',
        params: ['medical_records', false, 999999], // stream name: medical_records, verbose, count
        id: 1,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`MultiChain RPC failed: ${response.status} ${response.statusText}`)
      console.error('Response body:', errorText)
      // Return empty results instead of error so app can continue
      return NextResponse.json({ success: true, cids: [], count: 0, warning: `MultiChain not available: ${response.statusText}` })
    }

    const result = await response.json()
    
    if (result.error) {
      console.error('MultiChain error:', result.error)
      // Return empty results instead of error
      return NextResponse.json({ success: true, cids: [], count: 0, warning: result.error.message })
    }

    console.log('MultiChain raw result:', JSON.stringify(result, null, 2))
    console.log('Number of items in stream:', result.result?.length || 0)

    // Filter items by patient ID (extract patient ID from key before underscore)
    const patientRecords = result.result.filter((item: any) => {
      if (item.keys && item.keys.length > 0) {
        const key = item.keys[0]
        // Key format: "PAT251102-63474_2025-10-27T16:38:23.319Z"
        // Extract patient ID (part before underscore)
        const keyPatientId = key.split('_')[0]
        const matches = keyPatientId === patientId
        console.log(`Checking key: ${key} | Extracted: ${keyPatientId} | Looking for: ${patientId} | Match: ${matches}`)
        return matches
      }
      return false
    })

    console.log(`Found ${patientRecords.length} records for patient ${patientId}`)

    // Extract CIDs from the records
    const cids = patientRecords.map((item: any) => {
      try {
        // Decode hex data to JSON
        const hexData = item.data
        const jsonData = Buffer.from(hexData, 'hex').toString('utf8')
        const parsed = JSON.parse(jsonData)
        
        // Extract timestamp from key: "PAT251102-63474_2025-10-27T16:38:23.319Z"
        const key = item.keys[0]
        const timestampFromKey = key.split('_')[1] || parsed.timestamp || new Date(item.blocktime * 1000).toISOString()
        
        console.log(`Extracted CID: ${parsed.cid}, Timestamp from key: ${timestampFromKey}`)
        
        return {
          cid: parsed.cid,
          timestamp: timestampFromKey,
          key: item.keys[0],
          txid: item.txid,
        }
      } catch (error) {
        console.error('Error parsing multichain item:', error, item)
        return null
      }
    }).filter((item: any) => item !== null)

    console.log(`Returning ${cids.length} CIDs:`, JSON.stringify(cids, null, 2))

    return NextResponse.json({ success: true, cids, count: cids.length })
  } catch (error: any) {
    console.error('Error fetching patient records from MultiChain:', error)
    // Return empty results instead of error so app can continue
    return NextResponse.json({ 
      success: true, 
      cids: [], 
      count: 0, 
      warning: error.message || 'MultiChain connection failed' 
    })
  }
}
