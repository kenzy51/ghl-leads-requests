
const GHL_API_KEY = process.env.GHL_API_KEY;
const LOCATION_ID = process.env.GHL_LOCATION_ID;

export async function getAllLeads() {
  if (!GHL_API_KEY || !LOCATION_ID) {
    console.error("Missing GHL API Key or Location ID");
    return [];
  }

  let allContacts: any[] = [];
  let nextUrl = `https://services.leadconnectorhq.com/contacts/?locationId=${LOCATION_ID}&limit=100`;
  let hasMore = true;

  try {
    while (hasMore && allContacts.length < 250) {
      const response = await fetch(nextUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-04-15',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("GHL API Error:", errorData);
        break; 
      }

      const data = await response.json();
      const contacts = data.contacts || [];
      allContacts = [...allContacts, ...contacts];

      // Check if there is another page and if we still need more to hit 250
      if (data.meta && data.meta.nextPageUrl && allContacts.length < 250) {
        nextUrl = data.meta.nextPageUrl;
      } else {
        hasMore = false;
      }
    }

    return allContacts;
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
}