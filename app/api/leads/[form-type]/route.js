import { NextResponse } from 'next/server';
import { FORM_ROUTING } from '../../../../app/lib/config';
export async function POST(req, { params }) {
  const resolvedParams = await params;
  const formType = resolvedParams['form-type']; 
  
  const config = FORM_ROUTING[formType];

  if (!config) {
    console.error("Available configs:", Object.keys(FORM_ROUTING));
    return NextResponse.json({ error: `Invalid form type: ${formType}` }, { status: 400 });
  }

  try {
    const body = await req.json();
    
    const { name, phone, email } = body;

    const newoPayload = {
      arguments: [
        {
          name: "content",
          value: `Call the user at ${phone}. User name: ${name}. You are a convoagent who has received an inquiry from an ad regarding the user requesting an ${config.scenario} dental visit. Confirm with the user that their email address is ${email} and follow the scenario.`
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