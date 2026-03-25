const MultichainNode = require('multichain-node');
const { Web3 } = require('web3');
require('dotenv').config();

// Initialize MultiChain
const multichain = MultichainNode({
    port: 6834,
    host: 'localhost',
    user: 'multichainrpc',
    pass: '' // Add your RPC password here if needed
});

// Initialize Web3
const web3 = new Web3('http://127.0.0.1:7545'); // Ganache port

async function checkRecords() {
    console.log('=== Checking All Records ===\n');

    try {
        // 1. Check MultiChain Stream
        console.log('Checking MultiChain records...');
        const streams = await new Promise((resolve, reject) => {
            multichain.listStreams((err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        const medicalStream = streams.find(s => s.name === 'medical_records');
        if (!medicalStream) {
            console.log('medical_records stream not found!');
            return;
        }

        console.log(`\nStream Info:`);
        console.log(`- Name: ${medicalStream.name}`);
        console.log(`- Items: ${medicalStream.items}`);
        console.log(`- Keys: ${medicalStream.keys}`);

        // 2. List all stream items
        const items = await new Promise((resolve, reject) => {
            multichain.listStreamItems({
                stream: 'medical_records',
                verbose: true
            }, (err, items) => {
                if (err) reject(err);
                else resolve(items);
            });
        });

        if (items && items.length > 0) {
            console.log('\nFound Records:');
            items.forEach((item, index) => {
                console.log(`\nRecord ${index + 1}:`);
                console.log(`Patient ID: ${item.keys[0]}`);
                try {
                    const decoded = Buffer.from(item.data, 'hex').toString();
                    console.log(`Public CID: ${decoded}`);
                } catch (e) {
                    console.log(`Raw Data: ${item.data}`);
                }
                console.log(`Time: ${new Date(item.blocktime * 1000).toLocaleString()}`);
                console.log(`Transaction: ${item.txid}`);
            });
        } else {
            console.log('\nNo records found in MultiChain');
        }

        // 3. List keys (patient IDs)
        const keys = await new Promise((resolve, reject) => {
            multichain.listStreamKeys({
                stream: 'medical_records',
                verbose: true
            }, (err, keys) => {
                if (err) reject(err);
                else resolve(keys);
            });
        });

        if (keys && keys.length > 0) {
            console.log('\nPatient IDs with records:');
            keys.forEach(key => {
                console.log(`- ${key.key} (${key.items} records)`);
            });
        }

    } catch (error) {
        console.error('Error checking records:', error.message);
    }
}

// Run the check
checkRecords();
