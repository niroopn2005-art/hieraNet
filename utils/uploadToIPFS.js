const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const FormData = require('form-data');

async function uploadToIPFS(fileContent, fileName) {
    try {
        console.log('Initializing Pinata upload for:', fileName);
        
        const pinata = new pinataSDK(
            process.env.NEXT_PUBLIC_PINATA_API_KEY,
            process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY
        );

        // Test authentication
        await pinata.testAuthentication();

        // Create a Buffer from the file content
        const buffer = Buffer.from(fileContent);

        // Create metadata
        const metadata = {
            name: fileName,
            keyvalues: {
                timestamp: Date.now().toString(),
                type: fileName.includes('private') ? 'private' : 'public'
            }
        };

        // Upload to IPFS via Pinata
        const result = await pinata.pinFileToIPFS(buffer, {
            pinataMetadata: metadata
        });

        console.log('IPFS Upload Success:', {
            fileName,
            cid: result.IpfsHash
        });

        return {
            success: true,
            cid: result.IpfsHash
        };

    } catch (error) {
        console.error('IPFS Upload Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = uploadToIPFS;