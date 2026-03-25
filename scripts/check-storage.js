const Web3 = require('web3');
const MultichainNode = require('multichain-node');
require('dotenv').config();

// Initialize Web3 with Ganache
const web3 = new Web3('http://127.0.0.1:7545');

// Initialize MultiChain
const multichain = MultichainNode({
    port: 6834,
    host: 'localhost',
    user: 'multichainrpc',
    pass: process.env.MULTICHAIN_PASS || ''
});

async function checkStorage(patientId) {
    console.log('Checking storage for:', patientId);

    // 1. Check MultiChain
    console.log('\nChecking MultiChain...');
    try {
        const items = await new Promise((resolve, reject) => {
            multichain.listStreamKeyItems({
                stream: 'medical_records',
                key: patientId
            }, (err, items) => {
                if (err) reject(err);
                else resolve(items);
            });
        });

        if (items && items.length > 0) {
            console.log('\nFound MultiChain records:');
            items.forEach((item, index) => {
                const hexData = item.data;
                try {
                    const decodedData = Buffer.from(hexData, 'hex').toString();
                    console.log(`\nRecord ${index + 1}:`);
                    console.log('CID:', decodedData);
                    console.log('Transaction:', item.txid);
                    console.log('Time:', new Date(item.blocktime * 1000).toLocaleString());
                } catch (e) {
                    console.log('Raw data:', hexData);
                }
            });
        } else {
            console.log('No MultiChain records found');
        }
    } catch (error) {
        console.error('MultiChain error:', error.message);
    }

    // 2. Print Ganache instructions
    console.log('\nTo check Ethereum storage:');
    console.log('1. Open Ganache UI');
    console.log('2. Go to Transactions tab');
    console.log('3. Look for transactions with your patient ID:', patientId);
    console.log('4. Or use the CLI tool with:');
    console.log(`   node final/final/medical-records.js viewRecords ${patientId}`);
}

// Get patient ID from command line
const patientId = process.argv[2];
if (!patientId) {
    console.log('Usage: node check-storage.js <patientId>');
    process.exit(1);
}

checkStorage(patientId).catch(console.error);
