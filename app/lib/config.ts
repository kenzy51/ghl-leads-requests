// lib/config.js
interface UserType {
  phone: string;
  name: string;
  email: string;
}
interface FormRoute {
  webhookUrl?: string;
  generatePrompt: (params: UserType) => string;
}
export const FORM_ROUTING: Record<string, FormRoute> = {
  emergency_form_id: {
    webhookUrl: "test",
    // "https://hooks.newo.ai/BpK3NhYODUjJcnK3mz77pQ",
    generatePrompt: ({ phone, name, email }) =>
      `Call the user at ${phone}. User name: ${name}. You are a convoagent who has received an inquiry from an ad regarding the user requesting an emergency dental visit. Confirm with the user that their email address is ${email} follow *Emergency Call* scenario`,
  },
  membership_form_id: {
    webhookUrl: "test",
    // "https://hooks.newo.ai/BpK3NhYODUjJcnK3mz77pQ"

    generatePrompt: ({ phone, name, email }) =>
      `Call the user at ${phone}. User name: ${name}. You are a convoagent who has received an inquiry from an ad regarding the user potentially signing up for our premium membership plan. Express excitement and inform the caller that they are making a great investment. The plan is $100 per month and includes discounts on several of our services including cleanings, routine exams, x-rays, ct scans and consultation with all of our specialists. Members enjoy discounts on all of our services and treatment. Confirm with the user that their email address is ${email} follow *Outbound promo for Membership plan* scenario`,
  },
};
