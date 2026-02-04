import { NextResponse } from 'next/server';
import { FORM_ROUTING } from '@/lib/config';
import { getAllLeads } from '@/lib/ghl';

export async function POST(req, { params }) {
  const { formType } = params; 
  const config = FORM_ROUTING[formType];

  if (!config) {
    return NextResponse.json({ error: "Invalid form type" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { phone, first_name, email } = body;

    const newoPayload = {
      arguments: [
        {
          name: "content",
          value: `Call ${first_name} at ${phone}. Form: ${config.scenario}. Email: ${email}.`
        }
      ]
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newoPayload),
    });

    return NextResponse.json({ success: response.ok });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}