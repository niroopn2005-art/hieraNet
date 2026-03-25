import { NextResponse } from 'next/server'
import { blockchainUtils } from '@/utils/blockchain-utils'

export async function GET() {
  try {
    const info = await new Promise((resolve, reject) => {
      blockchainUtils.multichain.getInfo((err: any, info: any) => {
        if (err) reject(err);
        else resolve(info);
      });
    });
    return NextResponse.json(info);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get MultiChain info' }, { status: 500 });
  }
}
