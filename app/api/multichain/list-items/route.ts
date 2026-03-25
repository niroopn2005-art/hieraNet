import { NextResponse } from 'next/server'
import { blockchainUtils } from '@/utils/blockchain-utils'

export async function POST(req: Request) {
  try {
    const { params } = await req.json()
    const items = await new Promise((resolve, reject) => {
      blockchainUtils.multichain.listStreamKeyItems(params, (err: any, items: any) => {
        if (err) reject(err);
        else resolve(items);
      });
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list MultiChain items' }, { status: 500 });
  }
}
