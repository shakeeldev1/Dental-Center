import type { LanguageCode } from '@/types';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  patient_id: string;
  scheduled_at: string;
  doctor_name: string | null;
  treatment: string | null;
  notes: string | null;
  status: AppointmentStatus;
  confirmation_sent: boolean;
  reminder_24h_sent: boolean;
  reminder_2h_sent: boolean;
  review_sent: boolean;
  reschedule_requested: boolean;
  created_at: string;
  updated_at: string;
}

/** Row from appointment_details (flattened patient fields). */
export interface AppointmentDetails extends Appointment {
  patient_name: string;
  patient_phone: string;
  patient_language: LanguageCode;
}

export interface AppointmentInput {
  patient_id: string;
  scheduled_at: string;
  doctor_name: string | null;
  treatment: string | null;
  notes: string | null;
}
