// lib/newo.js
export async function sendToNewo(phone, name, email, scenario = "Emergency Call") {
  const payload = {
    arguments: [
      {
        name: "content",
        value: `Call the user at ${phone}. User name: ${name}. You are a convoagent who has received an inquiry regarding an emergency dental visit. Confirm email: ${email}. Follow *${scenario}* scenario.`
      }
    ]
  };

  const response = await fetch('https://hooks.newo.ai/BpK3NhYODUjJcnK3mz77pQ', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return response.ok;
}