import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const zapierSecret = req.headers.get('x-zapier-secret');
  if (zapierSecret !== process.env.ZAPIER_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { lead_id, email, full_name, phone } = body;

    const nameParts = full_name ? full_name.split(" ") : ["Patient"];
    const first_name = nameParts[0];
    const last_name = nameParts.length > 1 ? nameParts.slice(1).join(" ") : " ";

    console.log(`🚀 Processing Lead: ${full_name} (${lead_id})`);

    let ghlStatus = "Skipped";
    try {
      const ghlResponse = await fetch(`https://services.leadconnectorhq.com/contacts/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GHL_PRIVATE_TOKEN}`,
          'Content-Type': 'application/json',
          'Version': '2021-04-15',
        },
        body: JSON.stringify({
          locationId: process.env.GHL_LOCATION_ID,
          firstName: first_name,
          lastName: last_name,
          email: email,
          phone: phone,
          customFields: [{ key: 'meta_lead_id', field_value: lead_id }],
          source: "Meta Lead Ads (via Vercel Pipeline)"
        }),
      });
      ghlStatus = ghlResponse.ok ? "✅ Success" : "❌ Failed";
    } catch (e) {
      console.error("GHL Error:", e);
      ghlStatus = "🔥 Error";
    }

    const seebPayload = {
      parsing: "default",
      data: [{
        first_name,
        last_name,
        phone_number: phone,
        email: email,
        description: "Nightlase spanish",
        metadata: {
          lead_id,
          source: "facebook_leads",
          priority: "high"
        },
      }],
    };

    const seebResponse = await fetch(
      // "https://api.seeb.ai/api/v1/webhook/outbound/6998c24d6c47d28eb827bb40", 

      "https://api.seeb.ai/api/v1/webhook/outbound/69bdb2352f1356e1853dd264 ",

      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Seeb-Secret": process.env.SEEB_AI_PASSWORD as string,
        },
        body: JSON.stringify(seebPayload),
      }
    );

    return NextResponse.json({
      success: true,
      ghl: ghlStatus,
      seeb: seebResponse.ok
    });

  } catch (error: any) {
    console.error("Critical Pipeline Failure:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}