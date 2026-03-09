// NIGHTLASE LEADS
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req) {
  const resend = new Resend(process.env.RESEND_API_KEY);
 

  try {
    const body = await req.json();
    const { first_name, last_name, phone, email, contact_source } = body;

    const messageContent = "Nightlase treatment."

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
            priority: "high"          },
        },
      ],
    };
    const headers = {
      "Content-Type": "application/json",
      "X-Seeb-Secret": process.env.SEEB_AI_PASSWORD,
    };
    const seebUrl = "https://api.seeb.ai/api/v1/webhook/outbound/69af061e58aab2a9bc38780b"
    const seebResponse = await fetch(
      seebUrl,
      {
        method: "POST",
        headers: headers,
        body: JSON.stringify(seebPayload),
      },
    );
    console.log(headers, seebUrl)
    if (!seebResponse.ok) {
      const errorText = await seebResponse.text();
      console.error("Seeb API Error:", errorText);
    }

    try {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: ["kanatnazarov51@gmail.com"],
        subject: `Nightlase New Lead: ${first_name}`,
        html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #d32f2f;"> NIghtlase New Lead Received</h2>
          <p><strong>Name:</strong> ${first_name} ${last_name || ""}</p>
          <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
          <p><strong>Email:</strong> ${email}</p>
          <hr />
          <p style="color: #666;">✅ <strong>AI Agent:</strong> ${seebResponse.ok ? "Call Sent to Seeb.ai" : "Seeb.ai Trigger Failed"}</p>
        </div>
      `,
      });
    } catch (emailError) {
      console.error("Email notification failed:", emailError);
    }
    console.log(seebPayload, seebResponse);

    return NextResponse.json({ success: seebResponse.ok });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
