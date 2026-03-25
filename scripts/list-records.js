const MultichainNode = require('multichain-node');

// Initialize MultiChain with default RPC settings
const multichain = MultichainNode({
    port: 6834,
    host: 'localhost',
    user: 'multichainrpc',
    pass: '' // Add your RPC password here
});

async function listAllRecords() {
    try {
        // First verify connection
        await new Promise((resolve, reject) => {
            multichain.getInfo((err, info) => {
                if (err) {
                    console.error('Connection error:', err.message);
                    reject(err);
                } else {
                    console.log('Connected to MultiChain');
                    resolve(info);
                }
            });
        });

        // List all stream items
        const items = await new Promise((resolve, reject) => {
            multichain.listStreamItems({
                stream: 'medical_records'
            }, (err, items) => {
                if (err) reject(err);
                else resolve(items);
            });
        });

        if (!items || items.length === 0) {
            console.log('No records found in the stream');
            return;
        }

        console.log('\nFound records:');
        items.forEach((item, index) => {
            try {
                console.log(`\nRecord ${index + 1}:`);
                console.log('Patient ID:', item.keys[0]);
                console.log('Raw Data:', item.data);
                console.log('Decoded:', Buffer.from(item.data, 'hex').toString());
                console.log('Time:', new Date(item.blocktime * 1000).toLocaleString());
                console.log('Transaction:', item.txid);
            } catch (e) {
                console.log('Error decoding record:', e.message);
            }
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Run the function
listAllRecords();
