import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationId = process.env.GHL_LOCATION_ID;
  const apiKey = process.env.GHL_API_KEY;
  
  // Get pagination params from the frontend request
  const limit = searchParams.get("limit") || "20";
  const after = searchParams.get("after") || ""; // GHL uses 'after' for the next cursor

  const url = new URL("https://services.leadconnectorhq.com/contacts/");
  url.searchParams.append("locationId", locationId!);
  url.searchParams.append("limit", limit);
  if (after) url.searchParams.append("after", after);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Version': '2021-04-15',
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    // Return both the contacts and the next cursor for the frontend
    return NextResponse.json({
      contacts: data.contacts || [],
      nextPageUrl: data.meta?.nextPageUrl || null,
      after: data.meta?.after || null, // The cursor for the next batch
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}