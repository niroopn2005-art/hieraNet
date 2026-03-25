import { NextRequest, NextResponse } from 'next/server'
import { encryptData } from '@/utils/encryption'
import { uploadToPinata } from '@/utils/pinataUtils'

export async function POST(request: NextRequest) {
  try {
    const { content, fileName, walletAddress, patientId, encrypt = true } = await request.json()

    if (!content || !fileName) {
      return NextResponse.json(
        { success: false, error: 'Content and fileName are required' },
        { status: 400 }
      )
    }

    // Encrypt data if encryption is enabled and required params are provided
    let dataToUpload = content
    let isEncrypted = false
    
    if (encrypt && walletAddress && patientId) {
      console.log('🔐 Encrypting data before IPFS upload...')
      console.log('Wallet address:', walletAddress)
      console.log('Patient ID:', patientId)
      
      // Normalize wallet address to lowercase for consistency
      const normalizedWallet = walletAddress.toLowerCase()
      
      dataToUpload = encryptData(content, normalizedWallet, patientId)
      isEncrypted = true
      console.log('✅ Data encrypted successfully')
    } else {
      console.log('⚠️ Uploading unencrypted data to IPFS')
    }

    // Upload to IPFS using the same method as registration
    const result = await uploadToPinata(
      dataToUpload,
      fileName,
      {
        name: fileName,
        keyvalues: {
          encrypted: isEncrypted.toString(),
          patientId: patientId || 'unknown',
          algorithm: isEncrypted ? 'AES-256-CBC' : 'none',
          timestamp: new Date().toISOString()
        }
      }
    )

    if (!result.success) {
      throw new Error(result.error || 'Failed to upload to IPFS')
    }

    console.log('IPFS Upload Result:', result.cid)
    console.log('Data encrypted:', isEncrypted)

    return NextResponse.json({
      success: true,
      cid: result.cid,
      encrypted: isEncrypted
    })
  } catch (error: any) {
    console.error('IPFS Upload Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload to IPFS' },
      { status: 500 }
    )
  }
}
