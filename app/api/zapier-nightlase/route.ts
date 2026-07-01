/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Updated interface to mirror Zapier's nested payload structure
interface ZapierLeadBody {
  lead_id: string;
  data?: {
    email: string;
    full_name: string;
    phone: string;
  };
}

// Helper function to format phone number to E.164 compliance
function formatToE164(phoneStr: string): string {
  if (!phoneStr) return "";
  
  // Strip out everything except digits
  const cleaned = phoneStr.replace(/\D/g, "");
  
  // Format standard 10-digit North American numbers
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length > 10 && !phoneStr.startsWith("+")) {
    return `+${cleaned}`;
  }
  
  return phoneStr.startsWith("+") ? phoneStr : `+${cleaned}`;
}

export async function POST(req: Request) {
  const zapierSecret = req.headers.get('x-zapier-secret');
  if (zapierSecret !== process.env.ZAPIER_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: ZapierLeadBody = await req.json();
    
    // Extract lead_id from the root, and the contact fields from the nested data block
    const { lead_id } = body;
    const { full_name, email, phone } = body.data || { full_name: "", email: "", phone: "" };

    // ==========================================
    // DEBUG: DATA RECEIVED FROM ZAPIER
    // ==========================================
    console.log("==================================================");
    console.log("📥 [DEBUG] DATA RECEIVED FROM ZAPIER:");
    console.log(`   - lead_id:   ${lead_id}`);
    console.log(`   - full_name: ${full_name}`);
    console.log(`   - email:     ${email}`);
    console.log(`   - phone:     ${phone}`);
    console.log("==================================================");

    // Sanitize the phone string for downstream APIs
    const formattedPhone = formatToE164(phone);

    const nameParts = full_name ? full_name.split(" ") : ["Patient"];
    const first_name = nameParts[0];
    const last_name = nameParts.length > 1 ? nameParts.slice(1).join(" ") : " ";
    const messageContent = "Nightlase english";

    // ==========================================
    // 1. GO HIGH LEVEL (GHL) REQUEST
    // ==========================================
    let ghlStatus = "Skipped";
    console.log("🚀 SENDING TO GO-HIGH-LEVEL...");
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
          phone: formattedPhone,
          customFields: [{ key: 'meta_lead_id', field_value: lead_id }],
          source: "Meta Lead Ads (via Vercel Pipeline)"
        }),
      });
      ghlStatus = ghlResponse.ok ? "✅ Success" : `❌ Failed (${ghlResponse.status})`;
      if (!ghlResponse.ok) {
        console.error("GHL API Error Response:", await ghlResponse.text());
      }
    } catch (e: any) {
      console.error("GHL Execution Exception:", e.message);
      ghlStatus = "🔥 Error";
    }
    console.log(`📡 GHL STATUS: ${ghlStatus}`);
    console.log("--------------------------------------------------");


    // ==========================================
    // 2. SEEB.AI REQUESTS (Both Endpoints)
    // ==========================================
    const seebPayload = {
      parsing: "default",
      data: [{
        first_name,
        last_name,
        phone_number: formattedPhone,
        email: email,
        description: messageContent,
        metadata: {
          lead_id,
          source: "facebook_leads",
          priority: "high"
        },
      }],
    };

    // ==========================================
    // DEBUG: DATA BEING SENT TO SEEB
    // ==========================================
    console.log("==================================================");
    console.log("🚀 [DEBUG] OUTBOUND PAYLOAD BEING SENT TO SEEB.AI:");
    console.log(JSON.stringify(seebPayload, null, 2));
    console.log("==================================================");

    const seebHeaders = {
      "Content-Type": "application/json",
      "X-Seeb-Secret": process.env.SEEB_AI_PASSWORD as string,
    };

    const seebEndpoints = [
      "https://api.seeb.ai/api/v1/webhook/outbound/6a457905aa09c512c1fbfc27",
      "https://api.seeb.ai/api/v1/webhook/outbound/6a457905aa09c512c1fbfc27"
    ];

    const seebStatuses: boolean[] = [];

    for (const [index, url] of seebEndpoints.entries()) {
      console.log(`🚀 SENDING TO SEEB ENDPOINT #${index + 1}...`);
      try {
        const seebResponse = await fetch(url.trim(), {
          method: "POST",
          headers: seebHeaders,
          body: JSON.stringify(seebPayload),
        });
        
        console.log(`📡 SEEB #${index + 1} STATUS: ${seebResponse.status} ${seebResponse.statusText}`);
        seebStatuses.push(seebResponse.ok);
        
        if (!seebResponse.ok) {
          console.error(`❌ Seeb #${index + 1} Error Details:`, await seebResponse.text());
        }
      } catch (e: any) {
        console.error(`💥 Seeb #${index + 1} Network Exception:`, e.message);
        seebStatuses.push(false);
      }
    }
    console.log("--------------------------------------------------");


    // ==========================================
    // 3. NEWTON MARKETING REQUEST
    // ==========================================
    const newtonPayload = {
      parsing: "default",
      data: [
        {
          first_name: first_name,
          last_name: last_name,
          phone_number: formattedPhone,
          description: messageContent,
          campaignType: "Nightlase english speaking",
          email: email,
          metadata: {
            source: "facebook_leads",
            priority: "high",
          },
        },
      ],
    };

    const newtonHeaders = {
      "Content-Type": "application/json",
      "X-Newton-Secret": process.env.NEWTON_MARKETING_SECRET || "06b81da012d94c973e454535114331cc8c5d9ebd64d46c96267dfd0f3d5b5891",
    };
    const newtonUrl = "https://dentalexpressserver.azurewebsites.net/newtonMarketingWebhook";

    console.log("🚀 SENDING TO NEWTON MARKETING...");
    let newtonResponseOk = false;
    try {
      const newtonResponse = await fetch(newtonUrl, {
        method: "POST",
        headers: newtonHeaders,
        body: JSON.stringify(newtonPayload),
      });

      newtonResponseOk = newtonResponse.ok;
      console.log(`📡 NEWTON RESPONSE STATUS: ${newtonResponse.status} ${newtonResponse.statusText}`);

      if (!newtonResponse.ok) {
        console.error("❌ Newton API Error Details:", await newtonResponse.text());
      }
    } catch (e: any) {
      console.error("💥 Newton Fetch Network Exception:", e.message);
    }
    console.log("==================================================");

    return NextResponse.json({
      success: true,
      ghl: ghlStatus,
      seeb_endpoint_1: seebStatuses[0] || false,
      seeb_endpoint_2: seebStatuses[1] || false,
      newton: newtonResponseOk
    });

  } catch (error: any) {
    console.error("💥 CRITICAL PIPELINE FAILURE:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}