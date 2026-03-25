import { NextResponse } from 'next/server';
import MultichainNode from 'multichain-node';

const multichain = MultichainNode({
    port: process.env.MULTICHAIN_PORT || 6834,
    host: process.env.MULTICHAIN_HOST || 'localhost',
    user: process.env.MULTICHAIN_USER || 'multichainrpc',
    pass: process.env.MULTICHAIN_PASS
});

export async function POST(req: Request) {
    try {
        const { patientId, publicCID, doctorId } = await req.json();

        if (!patientId || !publicCID || !doctorId) {
            return NextResponse.json({
                success: false,
                error: 'Missing required parameters'
            }, { status: 400 });
        }

        // Store in MultiChain
        const result = await new Promise((resolve, reject) => {
            multichain.publish({
                stream: 'medical_records',
                key: patientId,
                data: Buffer.from(JSON.stringify({
                    cid: publicCID,
                    doctorId,
                    timestamp: new Date().toISOString()
                })).toString('hex')
            }, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        return NextResponse.json({
            success: true,
            txid: result
        });

    } catch (error) {
        console.error('MultiChain storage error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
