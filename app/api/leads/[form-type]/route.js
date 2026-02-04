import { NextResponse } from "next/server";
import { FORM_ROUTING } from "../../../../app/lib/config";
import { Resend } from "resend";
export async function POST(req, { params }) {
  const resend = new Resend("re_4TXezg2e_MmgmzzvqrQxSenZTsgt8HHaT");

  const resolvedParams = await params;
  const formType = resolvedParams["form-type"];
  const config = FORM_ROUTING[formType];
  if (!config) {
    console.error("Available configs:", Object.keys(FORM_ROUTING));
    return NextResponse.json(
      { error: `Invalid form type: ${formType}` },
      { status: 400 },
    );
  }

  try {
    const body = await req.json();
    const { first_name, phone, email, id: contactId, contact_source } = body;

    const newoResponse = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        arguments: [
          {
            name: "content",
            value: `Call the user at ${phone}. User name: ${first_name}. You are a convoagent who has received an inquiry from an ad regarding the user requesting an emergency dental.Confirm with the user that their email address is ${email} follow *Emergency Call* scenario"`,
          },
        ],
      }),
    });

    try {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: ["kanatnazarov51@gmail.com"],
        subject: `🦷 New Emergency Lead: ${first_name}`,
        html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #d32f2f;">New Emergency Lead Received</h2>
          <p><strong>Name:</strong> ${first_name}</p>
          <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Ad Source:</strong> ${contact_source || "Not specified"}</p>
          <hr />
          <p style="color: #666;">✅ <strong>AI Agent:</strong> Outbound call has been triggered via NEWO.</p>
        </div>
      `,
      });
      console.log("Notification email sent to clinic.", body);
    } catch (emailError) {
      console.error(
        "Email failed to send, but AI call was triggered:",
        emailError,
      );
    }

    return NextResponse.json({ success: newoResponse.ok });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
