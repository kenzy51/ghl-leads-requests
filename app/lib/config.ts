// lib/config.js
interface UserType {
  phone: string;
  name: string;
  email: string;
}
interface FormRoute {
  webhookUrl?: string;
}
export const FORM_ROUTING: Record<string, FormRoute> = {
  emergency_form_id: {
    webhookUrl: "test",
  },
  membership_form_id: {
    webhookUrl: "test",
  }, 
  nightlase_form_id: {
    webhookUrl: "test",
  },
};


