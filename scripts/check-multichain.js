const MultichainNode = require('multichain-node');

// Initialize MultiChain with updated port and credentials
const multichain = MultichainNode({
    port: 6835,  // Updated to match your daemon port
    host: 'localhost',
    user: 'multichainrpc',
    pass: '',  // Add your RPC password from multichain.conf
    timeout: 15000,  // Increased timeout
    keepalive: true,
    debug: true  // Enable debug logging
});

async function main() {
    console.log('=== MultiChain Connection Test ===\n');

    try {
        // Test basic connection
        console.log('1. Testing basic connection...');
        const info = await new Promise((resolve, reject) => {
            multichain.getInfo((err, info) => {
                if (err) {
                    console.error('Connection failed:', err.message);
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        });

        console.log('✓ Connection successful!');
        console.log('Chain name:', info.chainname);
        console.log('Protocol version:', info.protocolversion);
        console.log('Node address:', info.nodeaddress);

        // List streams
        console.log('\n2. Checking streams...');
        const streams = await new Promise((resolve, reject) => {
            multichain.listStreams((err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        console.log('Found streams:', streams.length);
        streams.forEach(stream => {
            console.log(`- ${stream.name} (${stream.items} items)`);
        });

        // Check medical_records stream
        const medicalStream = streams.find(s => s.name === 'medical_records');
        if (medicalStream) {
            console.log('\n3. Medical Records stream info:');
            console.log('Items:', medicalStream.items);
            console.log('Keys:', medicalStream.keys);
            console.log('Publishers:', medicalStream.publishers);
        } else {
            console.log('\nWarning: medical_records stream not found');
        }

    } catch (error) {
        console.error('\nConnection error:', error.message);
        console.log('\nTroubleshooting steps:');
        console.log('1. Check MultiChain configuration:');
        console.log('   Location: %APPDATA%\\MultiChain\\chain1\\multichain.conf');
        console.log('2. Verify RPC settings:');
        console.log('   - rpcuser=multichainrpc');
        console.log('   - rpcpassword=YOUR_PASSWORD');
        console.log('   - rpcport=6835');
        console.log('3. Restart MultiChain daemon:');
        console.log('   multichaind chain1 -daemon -rescan');
    }
}

// Run the test
main().catch(console.error).finally(process.exit);
