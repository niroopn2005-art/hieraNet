import { NextResponse } from 'next/server'
import { blockchainUtils } from '@/utils/blockchain-utils'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = await new Promise((resolve, reject) => {
      blockchainUtils.multichain.publish(body, (err: any, result: any) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to publish to MultiChain' }, { status: 500 });
  }
}
