const express = require('express');
const router = express.Router();
const IPFSUtil = require('../utils/ipfsUtils');
const fs = require('fs');
const path = require('path');

router.get('/test-ipfs', async (req, res) => {
    try {
        console.log('Starting IPFS test...');
        
        // Create a test file
        const testFilePath = path.join(__dirname, '../temp/test.csv');
        const testContent = 'name,age\ntest,25';
        
        // Ensure directory exists
        const dir = path.dirname(testFilePath);
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Write test file
        fs.writeFileSync(testFilePath, testContent);
        console.log('Test file created at:', testFilePath);

        // Initialize IPFS
        const ipfs = new IPFSUtil();
        console.log('IPFS initialized');

        // Upload to IPFS
        const cid = await ipfs.uploadToIPFS(testFilePath);
        console.log('File uploaded to IPFS');

        // Return result
        res.json({
            success: true,
            message: 'Test successful',
            cid: cid,
            url: `https://gateway.pinata.cloud/ipfs/${cid}`
        });

    } catch (error) {
        console.error('Test failed:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router; 