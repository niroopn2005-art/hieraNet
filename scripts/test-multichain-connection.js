const MultichainNode = require('multichain-node');
const fs = require('fs');
const os = require('os');
const path = require('path');

async function testConnection() {
    try {
        // 1. Read MultiChain config
        const configPath = path.join(os.homedir(), 'AppData', 'Roaming', 'MultiChain', 'chain1', 'multichain.conf');
        console.log('Reading config from:', configPath);
        
        const config = fs.readFileSync(configPath, 'utf8')
            .split('\n')
            .reduce((acc, line) => {
                const [key, value] = line.split('=');
                if (key && value) {
                    acc[key.trim()] = value.trim();
                }
                return acc;
            }, {});

        console.log('\nConfig found:');
        console.log('RPC Port:', config.rpcport);
        console.log('RPC User:', config.rpcuser);
        console.log('RPC Password:', config.rpcpassword ? '[SET]' : '[NOT SET]');

        // 2. Initialize MultiChain
        const multichain = MultichainNode({
            port: parseInt(config.rpcport) || 6835,
            host: 'localhost',
            user: config.rpcuser,
            pass: config.rpcpassword,
            timeout: 5000
        });

        // 3. Test connection
        console.log('\nTesting connection...');
        const info = await new Promise((resolve, reject) => {
            multichain.getInfo((err, info) => {
                if (err) reject(err);
                else resolve(info);
            });
        });

        console.log('\nConnection successful!');
        console.log('Chain Info:');
        console.log('- Name:', info.chainname);
        console.log('- Protocol:', info.protocolversion);
        console.log('- Node Version:', info.nodeversion);
        console.log('- Blocks:', info.blocks);

        // 4. Check medical_records stream
        const streams = await new Promise((resolve, reject) => {
            multichain.listStreams((err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        console.log('\nStreams found:', streams.length);
        streams.forEach(stream => {
            console.log(`- ${stream.name} (${stream.items} items)`);
        });

    } catch (error) {
        console.error('\nConnection failed:', error.message);
        console.log('\nTroubleshooting steps:');
        console.log('1. Check if MultiChain daemon is running:');
        console.log('   > multichaind chain1 -daemon');
        console.log('2. Verify config file exists and has correct settings:');
        console.log('   > rpcuser=multichainrpc');
        console.log('   > rpcpassword=<your-password>');
        console.log('   > rpcport=6835');
        console.log('3. Restart MultiChain:');
        console.log('   > multichaind chain1 -daemon -rescan');
    }
}

testConnection();
