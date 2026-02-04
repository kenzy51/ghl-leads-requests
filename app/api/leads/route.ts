import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch(
      `https://services.leadconnectorhq.com/contacts/?locationId=${process.env.GHL_LOCATION_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.GHL_PRIVATE_TOKEN}`,
          'Version': '2021-04-15',
        },
      }
    );
    const data = await res.json();
    return NextResponse.json(data.contacts || []);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}