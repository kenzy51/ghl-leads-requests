// NIGHTLASE LEADS
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const body = await req.json();
    
    // Log the incoming request body hitting your Next.js route
    console.log("==================================================");
    console.log("📥 INCOMING WEBHOOK TRIGGERED");
    console.log("RAW BODY:", JSON.stringify(body, null, 2));
    console.log("==================================================");

    const { first_name, last_name, phone, email, contact_source } = body;
    const messageContent = "Nightlase treatment.";

    // ==========================================
    // 1. SEEB.AI REQUEST
    // ==========================================
    const seebPayload = {
      parsing: "default",
      data: [
        {
          first_name: first_name,
          last_name: last_name || "Patient",
          phone_number: phone,
          description: messageContent,
          email: email,
          metadata: {
            source: contact_source || "homepage_signup",
            priority: "high",
          },
        },
      ],
    };
    const seebHeaders = {
      "Content-Type": "application/json",
      "X-Seeb-Secret": process.env.SEEB_AI_PASSWORD,
    };
    const seebUrl = "https://api.seeb.ai/api/v1/webhook/outbound/69af061e58aab2a9bc38780b";
    
    console.log("🚀 SENDING REQUEST TO SEEB.AI...");
    console.log("URL:", seebUrl);
    console.log("HEADERS:", JSON.stringify(seebHeaders, null, 2));
    console.log("PAYLOAD:", JSON.stringify(seebPayload, null, 2));

    const seebResponse = await fetch(seebUrl, {
      method: "POST",
      headers: seebHeaders,
      body: JSON.stringify(seebPayload),
    });

    console.log(`📡 SEEB.AI RESPONSE STATUS: ${seebResponse.status} ${seebResponse.statusText}`);
    if (!seebResponse.ok) {
      const errorText = await seebResponse.text();
      console.error("❌ Seeb API Error Details:", errorText);
    } else {
      console.log("✅ Seeb.ai responded successfully.");
    }
    console.log("--------------------------------------------------");


    // ==========================================
    // 2. NEWTON MARKETING REQUEST
    // ==========================================
    const newtonPayload = {
      parsing: "default",
      data: [
        {
          first_name: first_name,
          last_name: last_name || "Patient",
          phone_number: phone,
          description: messageContent,
          campaignType: "Nightlase",
          email: email,
          metadata: {
            source: contact_source || "homepage_signup",
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

    console.log("🚀 SENDING REQUEST TO NEWTON MARKETING...");
    console.log("URL:", newtonUrl);
    console.log("HEADERS:", JSON.stringify(newtonHeaders, null, 2));
    console.log("PAYLOAD:", JSON.stringify(newtonPayload, null, 2));

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
        const errorText = await newtonResponse.text();
        console.error("❌ Newton API Error Details:", errorText);
      } else {
        console.log("✅ Newton Marketing responded successfully.");
      }
    } catch (e) {
      console.error("💥 Newton Fetch Network Exception:", e.message);
    }
    console.log("==================================================");


    // ==========================================
    // 3. EMAIL NOTIFICATION (RESEND)
    // ==========================================
    try {
      console.log("📧 Sending summary email via Resend...");
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: ["kanatnazarov51@gmail.com"],
        subject: `Nightlase New Lead: ${first_name}`,
        html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #d32f2f;"> Nightlase New Lead Received</h2>
          <p><strong>Name:</strong> ${first_name} ${last_name || ""}</p>
          <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
          <p><strong>Email:</strong> ${email}</p>
          <hr />
          <p style="color: #666;">✅ <strong>AI Agent:</strong> ${seebResponse.ok ? "Call Sent to Seeb.ai" : "Seeb.ai Trigger Failed"}</p>
          <p style="color: #666;">✅ <strong>Newton Marketing:</strong> ${newtonResponseOk ? "Sent to Newton" : "Newton Trigger Failed"}</p>
        </div>
      `,
      });
      console.log("📬 Resend email dispatched successfully.");
    } catch (emailError) {
      console.error("❌ Email notification failed to send:", emailError);
    }

    return NextResponse.json({
      success: seebResponse.ok && newtonResponseOk,
      seeb: seebResponse.ok,
      newton: newtonResponseOk,
    });
  } catch (error) {
    console.error("💥 CRITICAL ROUTE ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}