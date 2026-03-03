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

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body: MetaLeadPayload = await req.json();

    if (body.object === "page" && body.entry?.[0]?.changes?.[0]?.value) {
      const leadId = body.entry[0].changes[0].value.leadgen_id;

      // 1. Fetch lead data with a 5-second timeout
      const metaRes = await fetch(
        `https://graph.facebook.com/v22.0/${leadId}?fields=field_data&access_token=${process.env.META_ACCESS_TOKEN}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (!metaRes.ok) {
        console.error("Meta API Error:", await metaRes.text());
        throw new Error("Failed to fetch lead from Meta");
      }

      const metaData: MetaLeadDetails = await metaRes.json();

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
        } else if (field.name === "first_name") {
          firstName = value;
        } else if (field.name === "last_name") {
          lastName = value;
        } else if (field.name === "phone_number") {
          phone = value;
        } else if (field.name === "email") {
          email = value;
        }
      });

      // 2. Trigger Seeb.ai and Resend SIMULTANEOUSLY to save time
      const seebPayload = {
        parsing: "default",
        data: [{
          first_name: firstName,
          last_name: lastName,
          phone_number: phone,
          email: email,
          description: "New NightLase lead from Meta Ads.",
          metadata: { source: "meta_ads", priority: "high" },
        }],
      };

      // We use allSettled so if one fails, the other still runs
      const [seebResult] = await Promise.allSettled([
        fetch("https://api.seeb.ai/api/v1/webhook/outbound/6998c24d6c47d28eb827bb40", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Seeb-Secret": process.env.SEEB_AI_PASSWORD as string,
          },
          body: JSON.stringify(seebPayload),
          signal: AbortSignal.timeout(5000),
        }),
        resend.emails.send({
          from: "onboarding@resend.dev",
          to: ["kanatnazarov51@gmail.com"],
          subject: `🦷 META LEAD: ${firstName}`,
          html: `<p>New Lead: ${firstName} ${lastName}</p><p>Phone: ${phone}</p>`,
        })
      ]);

      const seebOk = seebResult.status === 'fulfilled' && seebResult.value.ok;

      // 3. Return 200 immediately to Meta to stop the "Pending" status
      return NextResponse.json({ success: true, ai_triggered: seebOk });
    }

    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    // We return a 200 even on error so Meta stops retrying the "Pending" lead
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}