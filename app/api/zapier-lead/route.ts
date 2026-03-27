import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // 1. Check for our Secret Header
  const zapierSecret = request.headers.get('x-zapier-secret');

  if (zapierSecret !== 'Tribeca2026') {
    console.error('❌ Unauthorized attempt blocked');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('--- ⚡️ AUTHORIZED ZAPIER WEBHOOK RECEIVED ⚡️ ---');

  try {
    const body = await request.json();
    console.log('📦 Data:', JSON.stringify(body, null, 2));

    // Map your Zapier fields
    const { email, full_name, phone, lead_id } = body;

    if (email || lead_id) {
       // logic for GoHighLevel / Seeb.ai goes here
       console.log(`Processing: ${full_name}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('🔥 Webhook processing failed:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}