const { Web3 } = require('web3');
const { abi, bytecode } = require('./compile');
require('dotenv').config();

async function deploy() {
    try {
        const web3 = new Web3(process.env.ETHEREUM_NODE_URL);
        
        const account = web3.eth.accounts.privateKeyToAccount(
            process.env.ETHEREUM_PRIVATE_KEY.startsWith('0x') 
                ? process.env.ETHEREUM_PRIVATE_KEY 
                : '0x' + process.env.ETHEREUM_PRIVATE_KEY
        );
        web3.eth.accounts.wallet.add(account);
        
        console.log('Deploying contract from account:', account.address);
        
        const contract = new web3.eth.Contract(abi);
        const deploy = contract.deploy({
            data: bytecode,
            arguments: []
        });
        
        const gas = await deploy.estimateGas();
        const gasPrice = await web3.eth.getGasPrice();
        
        const deployed = await deploy.send({
            from: account.address,
            gas: Math.floor(gas * 1.1),
            gasPrice
        });
        
        console.log('Contract deployed at:', deployed.options.address);
        return deployed.options.address;
        
    } catch (error) {
        console.error('Deployment failed:', error);
        process.exit(1);
    }
}

deploy(); 