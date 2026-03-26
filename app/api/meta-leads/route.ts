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
    
    // This will show the actual lead data structure in your Vercel logs
    console.log('Incoming Meta Webhook Body:', JSON.stringify(body, null, 2));

    // Meta sends an array of entries
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    
    // Check if this is a leadgen change
    if (changes?.field === 'leadgen') {
      const leadId = changes.value.leadgen_id;
      const pageId = changes.value.page_id;
      
      console.log(`New Lead Received! ID: ${leadId} from Page: ${pageId}`);

      // NEXT STEP: Call your GHL function here
      // await sendToGHL(leadId); 
    }

    return new Response('EVENT_RECEIVED', { status: 200 });
  } catch (err) {
    console.error('POST Error:', err);
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