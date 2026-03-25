const { Web3 } = require('web3');
require('dotenv').config();

async function verifySetup() {
    const web3 = new Web3(process.env.ETHEREUM_NODE_URL);
    console.log('\nVerifying setup...');
    
    // 1. Check contract
    const code = await web3.eth.getCode(process.env.CONTRACT_ADDRESS);
    console.log('Contract deployed:', code !== '0x');
    
    // 2. Check admin
    const accounts = await web3.eth.getAccounts();
    console.log('Available accounts:', accounts);
    
    // 3. Check admin balance
    const balance = await web3.eth.getBalance(accounts[0]);
    console.log('Admin balance:', web3.utils.fromWei(balance, 'ether'), 'ETH');
    
    return code !== '0x';
}

verifySetup().catch(console.error);