import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Just return success since we're only focusing on classification
    return NextResponse.json({ 
      success: true, 
      message: 'Data processed successfully'
    });

  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process data' },
      { status: 500 }
    );
  }
} 