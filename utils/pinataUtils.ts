import FormData from 'form-data';
import axios from 'axios';

const PINATA_API_URL = 'https://api.pinata.cloud';

export async function uploadToPinata(
    fileContent: string,
    fileName: string,
    metadata: { name: string; keyvalues: Record<string, any> }
) {
    try {
        // Create form data
        const formData = new FormData();
        
        // Convert string content to Buffer and append as file
        const buffer = Buffer.from(fileContent);
        formData.append('file', buffer, {
            filename: fileName,
            contentType: 'text/csv',
        });

        // Add metadata
        formData.append('pinataMetadata', JSON.stringify(metadata));

        // Make request to Pinata
        const response = await axios.post(
            `${PINATA_API_URL}/pinning/pinFileToIPFS`,
            formData,
            {
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
                    'pinata_api_key': process.env.NEXT_PUBLIC_PINATA_API_KEY!,
                    'pinata_secret_api_key': process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY!
                }
            }
        );

        console.log(`File ${fileName} uploaded to IPFS:`, response.data.IpfsHash);
        return {
            success: true,
            cid: response.data.IpfsHash
        };

    } catch (error) {
        console.error('Pinata upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
}
