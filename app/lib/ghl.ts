
const GHL_API_KEY = process.env.GHL_API_KEY;
const LOCATION_ID = process.env.GHL_LOCATION_ID;

export async function getAllLeads() {
  if (!GHL_API_KEY || !LOCATION_ID) {
    console.error("Missing GHL API Key or Location ID in environment variables");
    return [];
  }

  try {
    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/?locationId=${LOCATION_ID}&limit=20`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-04-15', // Required GHL API Version
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("GHL API Error:", errorData);
      return [];
    }

    const data = await response.json();
    
    // GHL returns an object with a 'contacts' array
    return data.contacts || [];
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
}