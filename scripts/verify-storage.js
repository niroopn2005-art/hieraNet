const { Web3 } = require('web3');
const MultichainNode = require('multichain-node');
require('dotenv').config();

// Initialize Web3 with your Ethereum provider (Ganache)
const web3 = new Web3('http://localhost:7545');  // Update port if different

// Initialize MultiChain
const multichain = MultichainNode({
    port: 6834,
    host: 'localhost',
    user: 'multichainrpc',
    pass: process.env.MULTICHAIN_PASS || 'your-rpc-password'
});

async function verifyStorage(patientId) {
    try {
        console.log('Verifying storage for patient:', patientId);
        
        // 1. Check MultiChain records
        console.log('\nChecking MultiChain records...');
        const streamItems = await new Promise((resolve, reject) => {
            multichain.listStreamKeyItems({
                stream: 'medical_records',
                key: patientId
            }, (err, items) => {
                if (err) reject(err);
                else resolve(items);
            });
        });

        if (streamItems && streamItems.length > 0) {
            console.log('\nMultiChain Records:');
            streamItems.forEach((item, index) => {
                const decodedData = Buffer.from(item.data, 'hex').toString();
                console.log(`${index + 1}. Public CID: ${decodedData}`);
                console.log(`   Transaction: ${item.txid}`);
                console.log(`   Timestamp: ${new Date(item.blocktime * 1000).toLocaleString()}`);
            });
        } else {
            console.log('No MultiChain records found');
        }

        // 2. Check Ethereum records
        console.log('\nChecking Ethereum records...');
        // Note: You'll need to implement this part with your actual contract
        console.log('To check Ethereum records:');
        console.log('1. Open Ganache');
        console.log('2. Look for transaction hash:', 'TX_HASH');
        console.log('3. Or use medical-records.js CLI tool: node final/final/medical-records.js');

    } catch (error) {
        console.error('Verification error:', error);
    }
}

// Check if patient ID was provided
const patientId = process.argv[2];
if (!patientId) {
    console.log('Usage: node verify-storage.js <patientId>');
    process.exit(1);
}

verifyStorage(patientId);
