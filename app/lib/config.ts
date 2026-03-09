// lib/config.js
interface FormRoute {
  webhookUrl?: string;
  label:string
}
export const FORM_ROUTING: Record<string, FormRoute> = {
  emergency_form_id: {
    webhookUrl: "test",
    label:"emergency"
  },
  membership_form_id: {
    webhookUrl: "test",
    label:"membership"
  },
  nightlase_form_id: {
    webhookUrl: "test",
    label:"nightlase"
  },
  implants_form_id: {
    webhookUrl: "test",
    label:"implants"
  },
  pediatrics_form_id: {
    webhookUrl: "test",
    label:"pediatrics"
  },
};
