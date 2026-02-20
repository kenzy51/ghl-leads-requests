import { NextResponse } from "next/server";
import { FORM_ROUTING } from "../../../../app/lib/config";
import { Resend } from "resend";

export async function POST(req, { params }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const resolvedParams = await params;
  const formType = resolvedParams["form-type"];
  const config = FORM_ROUTING[formType];

  if (!config) {
    return NextResponse.json(
      { error: `Invalid form type: ${formType}` },
      { status: 400 },
    );
  }

  try {
    const body = await req.json();
    const { first_name, last_name, phone, email, contact_source } = body;

    const messageContent = "Interested in AI CRM integration."

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
    const headers = {
      "Content-Type": "application/json",
      "X-Seeb-Secret": process.env.SEEB_AI_PASSWORD,
    };
    const seebResponse = await fetch(
      "https://api.seeb.ai/api/v1/webhook/outbound/6998c24d6c47d28eb827bb40",
      {
        method: "POST",
        headers: headers,
        body: JSON.stringify(seebPayload),
      },
    );
    console.log(headers)
    if (!seebResponse.ok) {
      const errorText = await seebResponse.text();
      console.error("Seeb API Error:", errorText);
    }

    try {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: ["kanatnazarov51@gmail.com"],
        subject: `🦷 New Lead: ${first_name}`,
        html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #d32f2f;">New Lead Received</h2>
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
