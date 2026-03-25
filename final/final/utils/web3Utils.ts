import Web3 from 'web3';
import { contractABI } from '../contractABI';

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

export const getWeb3 = async () => {
    if (!window.ethereum) throw new Error('Please install MetaMask');
    const web3 = new Web3(window.ethereum);
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    return web3;
};

export const getContract = async () => {
    const web3 = await getWeb3();
    return new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);
};
