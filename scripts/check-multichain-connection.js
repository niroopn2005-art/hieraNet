const MultichainNode = require('multichain-node');
const fs = require('fs');
const path = require('path');
const os = require('os');

// MultiChain configuration
const config = {
    port: 6835,  // Your actual port from getinfo
    host: 'localhost',
    user: 'multichainrpc',
    pass: 'your-password-here',  // Will be updated from config file
    timeout: 5000
};

// Path to MultiChain config
const multichainDir = path.join(os.homedir(), 'AppData', 'Roaming', 'MultiChain', 'chain1');
const configFile = path.join(multichainDir, 'multichain.conf');

async function readConfig() {
    try {
        console.log('Reading MultiChain config...');
        if (fs.existsSync(configFile)) {
            const content = fs.readFileSync(configFile, 'utf8');
            const lines = content.split('\n');
            
            lines.forEach(line => {
                if (line.startsWith('rpcuser=')) {
                    config.user = line.split('=')[1].trim();
                }
                if (line.startsWith('rpcpassword=')) {
                    config.pass = line.split('=')[1].trim();
                }
                if (line.startsWith('rpcport=')) {
                    config.port = parseInt(line.split('=')[1].trim());
                }
            });

            console.log('Config loaded:');
            console.log('- Port:', config.port);
            console.log('- User:', config.user);
            console.log('- Password:', config.pass ? '[SET]' : '[NOT SET]');
        } else {
            console.log('Config file not found, creating one...');
            const defaultConfig = `rpcuser=multichainrpc\nrpcpassword=your-password-here\nrpcport=6835`;
            fs.mkdirSync(multichainDir, { recursive: true });
            fs.writeFileSync(configFile, defaultConfig);
            console.log(`Created default config at: ${configFile}`);
            console.log('Please update the password in the config file and restart MultiChain');
            process.exit(1);
        }
    } catch (error) {
        console.error('Error reading config:', error.message);
        process.exit(1);
    }
}

async function checkConnection() {
    console.log('\nTesting MultiChain connection...');
    
    const multichain = MultichainNode(config);

    try {
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
        console.log('- Blocks:', info.blocks);
        console.log('- Node Address:', info.nodeaddress);

        // Check medical_records stream
        const streams = await new Promise((resolve, reject) => {
            multichain.listStreams((err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        const medicalStream = streams.find(s => s.name === 'medical_records');
        if (medicalStream) {
            console.log('\nMedical Records Stream:');
            console.log('- Items:', medicalStream.items);
            console.log('- Keys:', medicalStream.keys);
            console.log('- Publishers:', medicalStream.publishers);
        } else {
            console.log('\nWarning: medical_records stream not found');
        }

    } catch (error) {
        console.error('\nConnection failed:', error.message);
        console.log('\nTroubleshooting steps:');
        console.log('1. Check if MultiChain daemon is running:');
        console.log('   multichaind chain1 -daemon');
        console.log('2. Verify config file exists and has correct settings:');
        console.log(`   ${configFile}`);
        console.log('3. Make sure the port matches your getinfo output');
        console.log('4. Try restarting the daemon with:');
        console.log('   multichaind chain1 -daemon -rescan');
    }
}

// Run checks
(async () => {
    try {
        await readConfig();
        await checkConnection();
    } catch (error) {
        console.error('Error:', error.message);
    }
})();
