const MultichainNode = require('multichain-node');

// Initialize MultiChain with correct port from getinfo
const multichain = MultichainNode({
    port: 6835,  // Updated to match your node's port
    host: 'localhost',
    user: 'multichainrpc',
    pass: ''  // Add your RPC password if needed
});

async function checkRecords() {
    console.log('=== Checking Medical Records ===\n');

    try {
        // Test connection first
        const info = await new Promise((resolve, reject) => {
            multichain.getInfo((err, info) => {
                if (err) {
                    console.error('Connection error:', err.message);
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        });

        console.log('Connection successful!');
        console.log('Chain Info:');
        console.log('- Name:', info.chainname);
        console.log('- Version:', info.version);
        console.log('- Protocol:', info.protocolversion);
        console.log('- Blocks:', info.blocks);
        console.log('- Streams:', info.streams);

        // Check medical_records stream
        const streams = await new Promise((resolve, reject) => {
            multichain.listStreams((err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        console.log('\nListing available streams...');
        streams.forEach(stream => {
            console.log(`\nStream: ${stream.name}`);
            console.log('- Items:', stream.items);
            console.log('- Publishers:', stream.publishers || 0);
            console.log('- Keys:', stream.keys || 0);
        });

        // If medical_records exists, show its contents
        const medicalStream = streams.find(s => s.name === 'medical_records');
        if (medicalStream) {
            console.log('\nFetching medical records...');
            const items = await new Promise((resolve, reject) => {
                multichain.listStreamItems({
                    stream: 'medical_records',
                    verbose: true,
                    count: 100  // Limit to last 100 records
                }, (err, items) => {
                    if (err) reject(err);
                    else resolve(items);
                });
            });

            if (items && items.length > 0) {
                console.log('\nFound Records:');
                items.forEach((item, index) => {
                    console.log(`\nRecord ${index + 1}:`);
                    console.log('Patient ID:', item.keys[0]);
                    try {
                        const decoded = Buffer.from(item.data, 'hex').toString();
                        console.log('Decoded CID:', decoded);
                    } catch (e) {
                        console.log('Raw Data:', item.data);
                    }
                    console.log('Time:', new Date(item.blocktime * 1000).toLocaleString());
                    console.log('Transaction:', item.txid);
                });
            } else {
                console.log('\nNo records found in medical_records stream');
            }
        } else {
            console.log('\nWarning: medical_records stream not found');
        }

    } catch (error) {
        console.error('\nError:', error.message);
        console.log('\nTroubleshooting steps:');
        console.log('1. Check if MultiChain daemon is running');
        console.log('2. Verify RPC credentials');
        console.log('3. Check network connectivity');
        console.log('4. Ensure medical_records stream exists');
    }
}

// Run the check
checkRecords().finally(() => process.exit());
