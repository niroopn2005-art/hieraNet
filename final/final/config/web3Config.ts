import Web3 from 'web3';

export const CONTRACT_ADDRESS = '0x...'; // Replace with your deployed contract address

export const CONTRACT_ABI = [...]; // Add your contract ABI here

export const getWeb3 = async () => {
    if (typeof window.ethereum !== 'undefined') {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.enable();
        return web3;
    }
    throw new Error('No web3 provider detected');
};

export const getContract = async () => {
    const web3 = await getWeb3();
    return new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
};
