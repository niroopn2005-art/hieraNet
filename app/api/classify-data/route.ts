import { NextResponse } from 'next/server';
import { encryptData } from '@/utils/encryption';
import { uploadToPinata } from '@/utils/pinataUtils';

export async function POST(request: Request) {
    try {
        const data = await request.json();
        
        // Extract encryption parameters
        const { patientId, walletAddress } = data;
        
        if (!patientId || !walletAddress) {
            throw new Error('Patient ID and wallet address are required for encryption');
        }
        
        // Create private data CSV
        const privateData = [
            'Name,Phone,Email,Address,EmergencyPhone,EmergencyEmail',
            `${data.personalInfo.name},${data.personalInfo.phone},${data.personalInfo.email},${data.personalInfo.address},${data.personalInfo.emergencyPhone},${data.personalInfo.emergencyEmail}`
        ].join('\n');

        // Create public data CSV
        const publicData = [
            'TEMPF,PULSE,RESPR,BPSYS,BPDIAS,POPCT,Height,Weight,BMI,Gender',
            `${data.medicalData.TEMPF},${data.medicalData.PULSE},${data.medicalData.RESPR},${data.medicalData.BPSYS},${data.medicalData.BPDIAS},${data.medicalData.POPCT},${data.medicalData.Height},${data.medicalData.Weight},${data.medicalData.Bmi},${data.personalInfo.gender}`
        ].join('\n');

        console.log('🔐 Encrypting and uploading to IPFS...');

        // Encrypt private data before uploading
        const encryptedPrivateData = encryptData(privateData, walletAddress, patientId);
        
        // Encrypt public data before uploading
        const encryptedPublicData = encryptData(publicData, walletAddress, patientId);

        // Upload encrypted private data
        const privateUpload = await uploadToPinata(
            encryptedPrivateData,
            'private_data_encrypted.txt',
            {
                name: `Private Medical Data (Encrypted) - ${new Date().toISOString()}`,
                keyvalues: {
                    type: 'private',
                    encrypted: 'true',
                    algorithm: 'AES-256-CBC',
                    timestamp: new Date().toISOString()
                }
            }
        );

        // Upload encrypted public data
        const publicUpload = await uploadToPinata(
            encryptedPublicData,
            'public_data_encrypted.txt',
            {
                name: `Public Medical Data (Encrypted) - ${new Date().toISOString()}`,
                keyvalues: {
                    type: 'public',
                    encrypted: 'true',
                    algorithm: 'AES-256-CBC',
                    timestamp: new Date().toISOString()
                }
            }
        );

        if (!privateUpload.success || !publicUpload.success) {
            throw new Error(privateUpload.error || publicUpload.error || 'IPFS upload failed');
        }

        console.log('IPFS Upload Results:', {
            privateCID: privateUpload.cid,
            publicCID: publicUpload.cid
        });

        return NextResponse.json({
            success: true,
            data: {
                privateCID: privateUpload.cid,
                publicCID: publicUpload.cid,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            },
            { status: 500 }
        );
    }
}