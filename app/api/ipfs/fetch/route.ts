import { NextResponse } from 'next/server'
import { decryptData } from '@/utils/encryption'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const cid = searchParams.get('cid')
    const walletAddress = searchParams.get('walletAddress')
    const patientId = searchParams.get('patientId')
    const encrypted = searchParams.get('encrypted') === 'true'

    if (!cid) {
      return NextResponse.json({ error: 'CID is required' }, { status: 400 })
    }

    // Fetch from Pinata gateway
    const pinataGateway = `https://gateway.pinata.cloud/ipfs/${cid}`
    
    const response = await fetch(pinataGateway, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`)
    }

    // Get content type to determine how to parse
    const contentType = response.headers.get('content-type') || ''
    let data: any

    // Try to parse as JSON first
    const text = await response.text()
    
    if (contentType.includes('application/json')) {
      data = JSON.parse(text)
    } else if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      // Looks like JSON
      try {
        data = JSON.parse(text)
      } catch {
        // If JSON parsing fails, treat as text/CSV
        data = { raw: text, type: 'text' }
      }
    } else {
      // Treat as CSV or plain text
      data = { raw: text, type: 'csv' }
    }

    // Check if data is encrypted
    // Data can be encrypted if:
    // 1. It has 'encrypted' flag in metadata
    // 2. The 'encrypted' query param is true
    // 3. The raw text looks like encrypted data (starts with "U2FsdGVk" which is base64 for "Salted__")
    const isEncrypted = data.encrypted || encrypted || (data.raw && data.raw.startsWith('U2FsdGVk'))
    
    // Decrypt if data is encrypted and we have the necessary params
    if (isEncrypted && walletAddress && patientId) {
      console.log('🔓 Decrypting data from IPFS...')
      try {
        // Get the encrypted content - it could be in data.content or data.raw
        const encryptedContent = data.content || data.raw || text
        const decryptedContent = decryptData(encryptedContent, walletAddress, patientId)
        
        // Update the data object with decrypted content
        if (data.raw) {
          data.raw = decryptedContent
        }
        if (data.content) {
          data.content = decryptedContent
        }
        data.decrypted = true
        console.log('✅ Data decrypted successfully')
      } catch (decryptError: any) {
        console.error('❌ Decryption failed:', decryptError)
        console.log('⚠️  This might be old unencrypted data or data encrypted with different credentials')
        // Instead of returning 403, mark as failed decryption and return the data as-is
        // This allows backward compatibility with old unencrypted data
        data.decryptionFailed = true
        data.decryptionError = decryptError.message
        console.log('📄 Returning data as-is (might be unencrypted legacy data)')
      }
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error fetching from IPFS:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch from IPFS' },
      { status: 500 }
    )
  }
}
