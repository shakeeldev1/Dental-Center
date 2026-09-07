import type { CustomerStatus, Gender, LeadSource } from './types';

export const GENDER_LABEL: Record<Gender, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  google: 'Google',
  website: 'Website',
  walk_in: 'Walk-in',
  referral: 'Referral',
  campaign: 'Campaign',
  existing_patient: 'Existing Patient',
  other: 'Other',
};

export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = {
  new_lead: 'New Lead',
  contacted: 'Contacted',
  interested: 'Interested',
  appointment_requested: 'Appointment Requested',
  confirmed: 'Confirmed',
  visited: 'Visited',
  no_show: 'No Show',
  follow_up: 'Follow-up',
  converted: 'Converted',
  lost: 'Lost',
};

export const CUSTOMER_STATUS_TONE: Record<CustomerStatus, 'green' | 'gray' | 'amber' | 'sky' | 'red'> = {
  new_lead: 'amber',
  contacted: 'amber',
  interested: 'sky',
  appointment_requested: 'sky',
  confirmed: 'green',
  visited: 'green',
  no_show: 'red',
  follow_up: 'amber',
  converted: 'green',
  lost: 'gray',
};
