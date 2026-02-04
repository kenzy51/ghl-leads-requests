// import { NextResponse } from "next/server";
// import { FORM_ROUTING } from "../../../../app/lib/config";
// export async function POST(req, { params }) {
//   const resolvedParams = await params;
//   const formType = resolvedParams["form-type"];
//   const config = FORM_ROUTING[formType];
//   if (!config) {
//     console.error("Available configs:", Object.keys(FORM_ROUTING));
//     return NextResponse.json(
//       { error: `Invalid form type: ${formType}` },
//       { status: 400 },
//     );
//   }
//   try {
//     const body = await req.json();
//     const { name, phone, email, id: contactId } = body;
//     const newoPayload = {
//       arguments: [
//         {
//           name: "content",
//           value: `Call the user at ${phone}. User name: ${name}. You are a convoagent who has received an inquiry from an ad regarding the user requesting an ${config.scenario} dental visit. Confirm with the user that their email address is ${email} and follow the scenario.`,
//         },
//       ],
//     };

//     const response = await fetch(config.webhookUrl, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(newoPayload),
//     });

//     return NextResponse.json({ success: response.ok });
//   } catch (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import { FORM_ROUTING } from "../../../../app/lib/config";
export async function POST(req, { params }) {
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
  // ... existing imports and config check

  try {
    const body = await req.json();
    // IMPORTANT: Ensure your GHL Webhook sends 'id' or 'contact_id'
    const { name, phone, email, id: contactId } = body;

    // 1. Trigger the AI Agent
    const newoResponse = await fetch(config.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        arguments: [
          {
            name: "content",
            value: `Call the user at ${phone}. User name: ${name}. You are a convoagent who has received an inquiry from an ad regarding the user requesting an emergency dental.Confirm with the user that their email address is ${email} follow *Emergency Call* scenario"`,
          },
        ],
      }),
    });
    console.log(newoResponse);
    if (newoResponse.ok && contactId) {
      await fetch(
        `https://services.leadconnectorhq.com/contacts/${contactId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${process.env.GHL_ACCESS_TOKEN}`,
            Version: "2021-04-15",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customFields: [
              {
                id: "JtJ2Q6ou5Ed73zxNrlnM",
                key: "ai_called_status", 
                field_value: "Called",
                value: "Called", 
              },
            ],
          }),
        },
      );
    }

    return NextResponse.json({ success: newoResponse.ok });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
