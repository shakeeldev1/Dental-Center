import type { LanguageCode } from '@/types';

export type Gender = 'male' | 'female' | 'other';

export type CustomerType = 'individual' | 'family';

export type LeadSource =
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'google'
  | 'website'
  | 'walk_in'
  | 'referral'
  | 'campaign'
  | 'existing_patient'
  | 'other';

export type CustomerStatus =
  | 'new_lead'
  | 'contacted'
  | 'interested'
  | 'appointment_requested'
  | 'confirmed'
  | 'visited'
  | 'no_show'
  | 'follow_up'
  | 'converted'
  | 'lost';

export interface Patient {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  preferred_language: LanguageCode;
  notes: string | null;
  family_id: string | null;
  relationship: string | null;
  customer_type: CustomerType;
  gender: Gender | null;
  lead_source: LeadSource | null;
  customer_status: CustomerStatus;
  preferred_doctor_id: string | null;
  preferred_service_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Row from the patient_overview view (list screen). */
export interface PatientOverview extends Patient {
  last_visit: string | null;
  visits_count: number;
  next_treatment: string | null;
  next_treatment_date: string | null;
}

export interface PatientInput {
  full_name: string;
  phone: string; // normalized E.164 before insert
  email: string | null;
  date_of_birth: string | null;
  preferred_language: LanguageCode;
  notes: string | null;
  customer_type: CustomerType;
  gender: Gender | null;
  lead_source: LeadSource | null;
  preferred_doctor_id: string | null;
  preferred_service_id: string | null;
  family_id?: string | null;
  relationship?: string | null;
}
