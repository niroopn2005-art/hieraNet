import { contractABI } from '../final/final/contractABI';

export const CONTRACT_CONFIG = {
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    abi: contractABI
};

export { contractABI };
