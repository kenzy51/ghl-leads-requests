import { NextResponse } from 'next/server';

// GET: Handles the Meta Webhook Verification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Verify the token matches your .env META_VERIFY_TOKEN
  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    return new Response(challenge, { status: 200 });
  } else {
    return new Response('Forbidden', { status: 403 });
  }
}

// POST: Receives the Lead Notification from Meta
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Meta sends a notification that a lead exists. 
    // You then usually have to fetch the lead details using the lead_id.
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const leadId = changes?.value?.leadgen_id;

    if (leadId) {
      // 1. Fetch lead details from Meta Graph API (Optional but recommended)
      // 2. Send the data to GoHighLevel
      await sendToGoHighLevel(leadId);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error('Webhook Error:', err);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

async function sendToGoHighLevel(leadId: string) {
  // This is where you POST the new contact to GHL
  const response = await fetch(`https://services.leadconnectorhq.com/contacts/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GHL_PRIVATE_TOKEN}`,
      'Content-Type': 'application/json',
      'Version': '2021-04-15',
    },
    body: JSON.stringify({
      locationId: process.env.GHL_LOCATION_ID,
      customFields: [{ key: 'meta_lead_id', field_value: leadId }],
      // Add other mapping here based on the lead data you fetch
    }),
  });
  return response.json();
}