const MultichainNode = require('multichain-node');

// Initialize MultiChain with explicit parameters
const multichain = MultichainNode({
    port: 6834,
    host: 'localhost',
    user: 'multichainrpc',
    pass: 'your-rpc-password', // Replace with your actual password
    timeout: 5000,
    debug: true // Enable debug logging
});

function decodeHex(hex) {
    try {
        return Buffer.from(hex, 'hex').toString();
    } catch (error) {
        return `Error decoding: ${error.message}`;
    }
}

async function checkPatientData(patientId) {
    console.log(`\nChecking data for patient: ${patientId}`);
    
    try {
        // First check connection
        await new Promise((resolve, reject) => {
            multichain.getInfo((err, info) => {
                if (err) {
                    console.error('MultiChain connection error:', err);
                    reject(err);
                } else {
                    console.log('Connected to chain:', info.chainname);
                    resolve(info);
                }
            });
        });

        // List all stream items for debugging
        console.log('\nListing all stream items:');
        const allItems = await new Promise((resolve, reject) => {
            multichain.listStreamItems({
                stream: 'medical_records',
                verbose: true
            }, (err, items) => {
                if (err) reject(err);
                else resolve(items);
            });
        });

        console.log(`Found ${allItems.length} total records`);

        // Get patient specific items
        const items = await new Promise((resolve, reject) => {
            multichain.listStreamKeyItems({
                stream: 'medical_records',
                key: patientId,
                verbose: true
            }, (err, items) => {
                if (err) reject(err);
                else resolve(items);
            });
        });

        if (!items || items.length === 0) {
            console.log('No specific records found for this patient');
            return;
        }

        console.log('\nFound records:');
        items.forEach((item, index) => {
            console.log(`\nRecord ${index + 1}:`);
            console.log('Raw data:', item.data);
            console.log('Decoded:', decodeHex(item.data));
            console.log('Transaction:', item.txid);
            console.log('Time:', new Date(item.blocktime * 1000).toLocaleString());
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Get patient ID from command line
const patientId = process.argv[2];
if (!patientId) {
    console.log('Usage: node decode-multichain.js <patientId>');
    process.exit(1);
}

checkPatientData(patientId);
