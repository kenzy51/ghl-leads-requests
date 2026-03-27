import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (token === process.env.META_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Verification failed', { status: 403 });
}

export async function POST(request: Request) {
  // 1. Absolute top-level log to prove the request arrived
  console.log('--- 🚀 INCOMING WEBHOOK DETECTED ---');

  try {
    const body = await request.json();
    
    // 2. Log the full payload so you can see it in Vercel
    console.log('📦 FULL BODY:', JSON.stringify(body, null, 2));

    // 3. Extract Lead ID (Checks both TEST sample and LIVE entry)
    const leadId = body.sample?.value?.leadgen_id || body.entry?.[0]?.changes?.[0]?.value?.leadgen_id;

    if (leadId) {
      console.log('🎯 LEAD ID CAPTURED:', leadId);
      // Here is where you will add the fetch to GHL/Seeb.ai
    } else {
      console.log('⚠️ Webhook received but no Lead ID found in this payload.');
    }

    return new Response('EVENT_RECEIVED', { status: 200 });
  } catch (err) {
    console.error('🔥 CRITICAL POST ERROR:', err);
    return new Response('Error', { status: 500 });
  }
}