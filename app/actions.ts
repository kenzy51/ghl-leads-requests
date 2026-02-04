'use server'

export async function createPatientLead(formData: FormData) {
  const name = formData.get('name');
  const email = formData.get('email');
  const phone = formData.get('phone');

  const response = await fetch('https://services.leadconnectorhq.com/contacts/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GHL_PRIVATE_TOKEN}`,
      'Version': '2021-07-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      email,
      phone,
      locationId: process.env.GHL_LOCATION_ID,
      tags: ['Website-Lead', 'Invisalign-Prospect']
    }),
  });

  if (!response.ok) throw new Error('Failed to sync with GHL');
  
  return { message: 'Success! Patient added to CRM.' };
}