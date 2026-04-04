import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const after = searchParams.get("after") || ""; 

  try {
    const url = new URL(`https://services.leadconnectorhq.com/contacts/`);
    url.searchParams.append("locationId", process.env.GHL_LOCATION_ID!);
    url.searchParams.append("limit", "20"); 
    
    // Only append 'after' if it actually exists to avoid malformed URLs
    if (after && after !== "null" && after !== "undefined") {
      url.searchParams.append("after", after);
    }

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${process.env.GHL_PRIVATE_TOKEN}`,
        'Version': '2021-04-15',
      },
      next: { revalidate: 0 } // Disable Next.js data caching for live leads
    });
    
    if (!res.ok) {
        const errorText = await res.text();
        console.error("GHL API Error:", errorText);
        return NextResponse.json({ error: "GHL Fetch Failed" }, { status: res.status });
    }

    const data = await res.json();
    
    return NextResponse.json({
      contacts: data.contacts || [],
      // Return the 'after' cursor so the frontend knows how to get the next page
      after: data.meta?.after || null 
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}