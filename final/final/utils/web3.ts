import Web3 from 'web3';
import { contractABI } from '../contractABI';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export const getWeb3Instance = async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const web3 = new Web3(window.ethereum);
            const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);
            return { web3, contract };
        } catch (error) {
            console.error('Error initializing web3:', error);
            throw new Error('Failed to initialize Web3');
        }
    }
    throw new Error('Please install MetaMask');
};
