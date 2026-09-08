export type TreatmentStatus = 'planned' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Treatment {
  id: string;
  patient_id: string;
  appointment_id: string | null;
  treatment: string;
  doctor_name: string | null;
  treatment_date: string;
  status: TreatmentStatus;
  next_treatment: string | null;
  next_treatment_date: string | null;
  treatment_reminder_sent: boolean;
  notes: string | null;
  created_at: string;
}

export interface UpcomingTreatment extends Treatment {
  patients: { full_name: string; phone: string } | null;
}

export interface FutureTreatmentInput {
  patient_id: string;
  treatment: string;
  notes: string | null;
  treatment_date: string; // expected/future date
  status: TreatmentStatus;
}
