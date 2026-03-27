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
  console.log('--- NEW POST ROUTE HIT ---');
  
  try {
    const body = await request.json();
    console.log('Body:', JSON.stringify(body, null, 2));

    const leadId = body.sample?.value?.leadgen_id || body.entry?.[0]?.changes?.[0]?.value?.leadgen_id;

    if (leadId) {
      console.log('Captured Lead ID:', leadId);
      // logic for GHL / Seeb.ai goes here
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('POST Error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}