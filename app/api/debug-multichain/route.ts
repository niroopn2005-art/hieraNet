import { NextResponse } from 'next/server';
import MultichainNode from 'multichain-node';

const multichain = MultichainNode({
    port: process.env.MULTICHAIN_PORT || 6834,
    host: process.env.MULTICHAIN_HOST || 'localhost',
    user: process.env.MULTICHAIN_USER || 'multichainrpc',
    pass: process.env.MULTICHAIN_PASS
});

export async function GET(request: Request) {
    try {
        // Get stream items
        const items = await new Promise((resolve, reject) => {
            multichain.listStreamItems({
                stream: 'medical_records',
                verbose: true
            }, (err, items) => {
                if (err) reject(err);
                else resolve(items);
            });
        });

        // Get stream info
        const info = await new Promise((resolve, reject) => {
            multichain.getStreamInfo({
                stream: 'medical_records'
            }, (err, info) => {
                if (err) reject(err);
                else resolve(info);
            });
        });

        return NextResponse.json({
            success: true,
            streamInfo: info,
            items: items
        });

    } catch (error) {
        console.error('MultiChain debug error:', error);
        return NextResponse.json({ success: false, error: String(error) });
    }
}
