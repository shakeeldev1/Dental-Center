import type { LanguageCode } from '@/types';

export interface Patient {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  preferred_language: LanguageCode;
  notes: string | null;
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
}
