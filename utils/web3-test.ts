import Web3 from 'web3';
import path from 'path';
import dotenv from 'dotenv';

// Add BigInt serialization handler with proper TypeScript types
const BigIntSerializer = () => {
    const originalStringify = JSON.stringify;
    type Replacer = (key: string, value: any) => any;
    type StringifyFunction = {
        (value: any, replacer?: Replacer | null, space?: string | number): string;
        (value: any, replacer?: (number | string)[] | null, space?: string | number): string;
    };
    
    (JSON.stringify as any) = function(
        value: any,
        replacer?: Replacer | (number | string)[] | null,
        space?: string | number
    ): string {
        return originalStringify(
            value,
            (key: string, val: any) => typeof val === 'bigint' ? val.toString() : val,
            space
        );
    } as StringifyFunction;
};

BigIntSerializer();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const testWeb3Installation = async () => {
    try {
        if (!process.env.NEXT_PUBLIC_ETHEREUM_NODE_URL) {
            throw new Error('NEXT_PUBLIC_ETHEREUM_NODE_URL is not defined');
        }

        const web3 = new Web3(new Web3.providers.HttpProvider(
            process.env.NEXT_PUBLIC_ETHEREUM_NODE_URL
        ));

        const networkId = await web3.eth.net.getId();
        const networkIdNumber = Number(networkId);
        console.log('Connected to network ID:', networkIdNumber);

        const block = await web3.eth.getBlock('latest');
        const blockNumber = Number(block.number);
        console.log('Latest block:', blockNumber);

        return {
            success: true,
            networkId: networkIdNumber,
            blockNumber: blockNumber,
            message: 'Web3 is properly installed and configured'
        };
    } catch (error) {
        console.error('Web3 installation test failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Web3 installation test failed'
        };
    }
};

// Modify the main execution to ignore deprecation warnings
if (require.main === module) {
    // Suppress deprecation warnings
    process.removeAllListeners('warning');
    
    console.log('Starting Web3 installation test...');
    console.log('Environment URL:', process.env.NEXT_PUBLIC_ETHEREUM_NODE_URL);
    
    testWeb3Installation()
        .then(result => {
            console.log('\nTest Results:', JSON.stringify(result, null, 2));
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test failed with error:', error);
            process.exit(1);
        });
}
