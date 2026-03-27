import { NextResponse } from 'next/server';


export async function POST(request: Request) {
  console.log('--- ⚡️ ZAPIER WEBHOOK RECEIVED ⚡️ ---');

  try {
    const body = await request.json();
    
    console.log('📦 DATA FROM ZAPIER:', JSON.stringify(body, null, 2));

    const { lead_id, email, full_name, phone } = body;

    if (lead_id || email) {
      console.log(`🎯 Processing Lead: ${full_name || 'No Name'} | ID: ${lead_id}`);

    }

    return NextResponse.json({ success: true, message: 'Data received' });
  } catch (err) {
    console.error('🔥 WEBHOOK ERROR:', err);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}