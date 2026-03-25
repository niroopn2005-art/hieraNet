import { NextResponse } from 'next/server';
import MultichainNode from 'multichain-node';

const multichain = MultichainNode({
    port: process.env.MULTICHAIN_PORT || 6834,
    host: process.env.MULTICHAIN_HOST || 'localhost',
    user: process.env.MULTICHAIN_USER || 'multichainrpc',
    pass: process.env.MULTICHAIN_PASS
});

export async function GET() {
    try {
        // Check stream exists
        const streams = await new Promise((resolve, reject) => {
            multichain.listStreams((err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        // Get stream info
        const info = await new Promise((resolve, reject) => {
            multichain.getInfo((err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        return NextResponse.json({
            success: true,
            streams,
            info
        });

    } catch (error) {
        console.error('Chain debug error:', error);
        return NextResponse.json({ 
            success: false, 
            error: String(error) 
        });
    }
}
