/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { Resend } from "resend";

// --- Types ---
interface MetaLeadPayload {
  object: string;
  entry: Array<{
    changes: Array<{
      value: {
        leadgen_id: string;
        page_id: string;
      };
      field: string;
    }>;
  }>;
}

interface MetaLeadDetails {
  field_data: Array<{
    name: string;
    values: string[];
  }>;
}

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * 1. VERIFICATION HANDSHAKE (GET)
 * Required by Meta to verify your webhook URL.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Verification failed", { status: 403 });
}

/**
 * 2. LEAD PROCESSING (POST)
 * Receives the lead ID from Meta, fetches details, and triggers AI.
 */
export async function POST(req: Request) {
  try {
    const body: MetaLeadPayload = await req.json();

    // Verify this is a leadgen event
    if (body.object === "page" && body.entry?.[0]?.changes?.[0]?.value) {
      const leadId = body.entry[0].changes[0].value.leadgen_id;

      // 1. Fetch full lead data from Meta Graph API
      const metaRes = await fetch(
        `https://graph.facebook.com/v22.0/${leadId}?fields=field_data,created_time&access_token=${process.env.META_ACCESS_TOKEN}`,
      );

      if (!metaRes.ok) throw new Error("Failed to fetch lead from Meta");

      const metaData: MetaLeadDetails = await metaRes.json();

      // 2. Map Meta's array format to clean variables
      let firstName = "Meta";
      let lastName = "Lead";
      let phone = "";
      let email = "";

      metaData.field_data.forEach((field) => {
        const value = field.values[0];
        if (field.name === "full_name") {
          const parts = value.split(" ");
          firstName = parts[0];
          lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
        }
        if (field.name === "first_name") firstName = value;
        if (field.name === "last_name") lastName = value;
        if (field.name === "phone_number") phone = value;
        if (field.name === "email") email = value;
      });

      const seebPayload = {
        parsing: "default",
        data: [
          {
            first_name: firstName,
            last_name: lastName,
            phone_number: phone,
            description: "New NightLase lead from Meta Ads.",
            email: email,
            metadata: {
              source: "meta_ads",
              priority: "high",
            },
          },
        ],
      };

      const seebResponse = await fetch(
        "https://api.seeb.ai/api/v1/webhook/outbound/6998c24d6c47d28eb827bb40",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Seeb-Secret": process.env.SEEB_AI_PASSWORD as string,
          },
          body: JSON.stringify(seebPayload),
        },
      );

      // 4. EMAIL NOTIFICATION TO YOU (Kanat)
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: ["kanatnazarov51@gmail.com"],
        subject: `🦷 META LEAD: ${firstName}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
            <h2 style="color: #1877F2;">New Meta Ads Lead</h2>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
            <p><strong>Email:</strong> ${email}</p>
            <hr />
            <p><strong>AI Agent:</strong> ${seebResponse.ok ? "✅ Triggered" : "❌ Failed"}</p>
          </div>
        `,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid payload structure" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Meta Webhook Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
