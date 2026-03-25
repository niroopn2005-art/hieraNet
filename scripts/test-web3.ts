import { Web3 } from 'web3';
require('dotenv').config();

async function main() {
    console.log('Starting Web3 connection test...');
    console.log('Environment URL:', process.env.NEXT_PUBLIC_ETHEREUM_NODE_URL);
    
    try {
        if (!process.env.NEXT_PUBLIC_ETHEREUM_NODE_URL) {
            throw new Error('NEXT_PUBLIC_ETHEREUM_NODE_URL is not defined in environment variables');
        }

        const web3 = new Web3(process.env.NEXT_PUBLIC_ETHEREUM_NODE_URL);
        
        console.log('Web3 instance created, testing connection...');
        
        const isConnected = await web3.eth.net.isListening();
        console.log('Connection test:', isConnected ? 'SUCCESS' : 'FAILED');
        
        const networkId = await web3.eth.net.getId();
        console.log('Network ID:', networkId);
        
        const accounts = await web3.eth.getAccounts();
        console.log('Available accounts:', accounts.length);
        console.log('First account:', accounts[0]);

    } catch (error) {
        console.error('Test failed with error:', error);
        process.exit(1);
    }
}

// Execute the test
main()
    .then(() => {
        console.log('Test completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Test failed:', error);
        process.exit(1);
    });
