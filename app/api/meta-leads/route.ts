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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 1. Log EVERYTHING immediately. 
    // If this doesn't show up, the request isn't hitting the server at all.
    console.log('--- RAW WEBHOOK START ---');
    console.log(JSON.stringify(body, null, 2));

    // 2. Handle the "Test" button from Meta Dashboard
    if (body.object === 'page' || body.sample) {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      
      // Use leadId from live changes OR from the sample payload
      const leadId = changes?.value?.leadgen_id || body.sample?.value?.leadgen_id;
      const pageId = changes?.value?.page_id || body.sample?.value?.page_id;

      if (leadId) {
        console.log(`✅ SUCCESS: Lead ID ${leadId} captured from Page ${pageId}`);
        // await sendToGoHighLevel(leadId); 
      } else {
        console.log('⚠️ Webhook received but no Lead ID found in payload.');
      }
    }

    return new Response('EVENT_RECEIVED', { status: 200 });
  } catch (err) {
    console.error('❌ POST Error:', err);
    return new Response('Error', { status: 500 });
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