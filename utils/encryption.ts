import CryptoJS from 'crypto-js'

/**
 * Derives an encryption key from a wallet address
 * Uses the wallet address as a seed for key derivation
 */
function deriveEncryptionKey(walletAddress: string, patientId: string): string {
  // Normalize wallet address to lowercase for case-insensitive key derivation
  const normalizedWallet = walletAddress.toLowerCase()
  // Combine wallet address and patient ID for unique key
  const seed = `${normalizedWallet}-${patientId}-medical-records`
  // Use SHA-256 to create a consistent key from the seed
  return CryptoJS.SHA256(seed).toString()
}

/**
 * Encrypts data using AES-256-CBC encryption
 * @param data - The plain text data to encrypt
 * @param walletAddress - The wallet address to derive encryption key
 * @param patientId - The patient ID for additional key uniqueness
 * @returns Encrypted data as base64 string
 */
export function encryptData(data: string, walletAddress: string, patientId: string): string {
  try {
    console.log('🔐 Encrypting data...')
    console.log('Data length:', data.length, 'bytes')
    console.log('Wallet address:', walletAddress)
    console.log('Patient ID:', patientId)
    
    // Derive encryption key from wallet address and patient ID
    const encryptionKey = deriveEncryptionKey(walletAddress, patientId)
    
    // Encrypt using AES-256
    const encrypted = CryptoJS.AES.encrypt(data, encryptionKey).toString()
    
    console.log('✅ Encryption successful')
    console.log('Encrypted data length:', encrypted.length, 'bytes')
    console.log('Encrypted data preview:', encrypted.substring(0, 50) + '...')
    
    return encrypted
  } catch (error: any) {
    console.error('❌ Encryption failed:', error)
    throw new Error(`Encryption failed: ${error.message}`)
  }
}

/**
 * Decrypts AES-256 encrypted data
 * @param encryptedData - The encrypted data as base64 string
 * @param walletAddress - The wallet address to derive decryption key
 * @param patientId - The patient ID for key derivation
 * @returns Decrypted plain text data
 */
export function decryptData(encryptedData: string, walletAddress: string, patientId: string): string {
  try {
    console.log('🔓 Decrypting data...')
    console.log('Encrypted data (first 50 chars):', encryptedData.substring(0, 50))
    console.log('Wallet address for decryption:', walletAddress)
    console.log('Patient ID for decryption:', patientId)
    
    // Try with normalized (lowercase) wallet address first
    const encryptionKey = deriveEncryptionKey(walletAddress, patientId)
    console.log('Derived key (first 20 chars):', encryptionKey.substring(0, 20))
    
    // Decrypt using AES-256
    const decrypted = CryptoJS.AES.decrypt(encryptedData, encryptionKey)
    let decryptedString = decrypted.toString(CryptoJS.enc.Utf8)
    
    // If decryption with normalized address fails, try with original mixed-case address
    if (!decryptedString && walletAddress.toLowerCase() !== walletAddress) {
      console.log('⚠️  Trying decryption with original mixed-case wallet address (backward compatibility)...')
      
      // Derive key using original mixed-case wallet (old encryption method before normalization)
      const seed = `${walletAddress}-${patientId}-medical-records`
      const legacyKey = CryptoJS.SHA256(seed).toString()
      
      const legacyDecrypted = CryptoJS.AES.decrypt(encryptedData, legacyKey)
      decryptedString = legacyDecrypted.toString(CryptoJS.enc.Utf8)
      
      if (decryptedString) {
        console.log('✅ Decryption successful with legacy mixed-case key (old data)')
      }
    }
    
    if (!decryptedString) {
      throw new Error('Decryption failed - invalid key or corrupted data')
    }
    
    console.log('✅ Decryption successful')
    console.log('Decrypted data (first 100 chars):', decryptedString.substring(0, 100))
    
    return decryptedString
  } catch (error: any) {
    console.error('❌ Decryption failed:', error)
    throw new Error(`Decryption failed: ${error.message}`)
  }
}

/**
 * Encrypts data and returns with metadata for verification
 */
export function encryptWithMetadata(data: string, walletAddress: string, patientId: string) {
  const encrypted = encryptData(data, walletAddress, patientId)
  
  return {
    encryptedData: encrypted,
    algorithm: 'AES-256-CBC',
    keyDerivation: 'SHA-256(walletAddress + patientId)',
    timestamp: new Date().toISOString(),
    originalSize: data.length,
    encryptedSize: encrypted.length
  }
}
