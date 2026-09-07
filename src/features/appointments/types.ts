import type { LanguageCode } from '@/types';

export type AppointmentStatus =
  | 'requested'
  | 'confirmed'
  | 'rescheduled'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Appointment {
  id: string;
  patient_id: string;
  scheduled_at: string;
  ends_at: string | null;
  doctor_name: string | null;
  treatment: string | null;
  doctor_id: string | null;
  service_id: string | null;
  notes: string | null;
  status: AppointmentStatus;
  confirmation_sent: boolean;
  reminder_24h_sent: boolean;
  reminder_2h_sent: boolean;
  review_sent: boolean;
  review_sent_at: string | null;
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
  ends_at: string | null;
  doctor_name: string | null;
  treatment: string | null;
  doctor_id: string | null;
  service_id: string | null;
  notes: string | null;
}
