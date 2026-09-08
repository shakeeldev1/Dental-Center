import { supabase } from '@/lib/supabase';
import type { FutureTreatmentInput, Treatment, TreatmentStatus, UpcomingTreatment } from './types';

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export async function listPatientTreatments(patientId: string): Promise<Treatment[]> {
  const db = requireClient();
  const { data, error } = await db
    .from('treatments')
    .select('*')
    .eq('patient_id', patientId)
    .order('treatment_date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Treatment[];
}

/** Treatments that have a scheduled next-treatment date (for the Treatments page). */
export async function listUpcomingTreatments(): Promise<UpcomingTreatment[]> {
  const db = requireClient();
  const { data, error } = await db
    .from('treatments')
    .select('*, patients(full_name, phone)')
    .not('next_treatment_date', 'is', null)
    .order('next_treatment_date', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as UpcomingTreatment[];
}

/**
 * Creates a future treatment as its own trackable row, linked to the same
 * patient (spec: appointment completion -> "Add Future Treatment"). When the
 * status is still upcoming (planned/scheduled), next_treatment/
 * next_treatment_date are set to the row's own values so the existing
 * treatment-reminder cron picks it up automatically — no backend changes
 * needed for that.
 */
export async function createFutureTreatment(input: FutureTreatmentInput): Promise<Treatment> {
  const db = requireClient();
  const {
    data: { user },
  } = await db.auth.getUser();

  const wantsReminder = input.status === 'planned' || input.status === 'scheduled';

  const { data, error } = await db
    .from('treatments')
    .insert({
      patient_id: input.patient_id,
      appointment_id: null,
      treatment: input.treatment,
      doctor_name: null,
      treatment_date: input.treatment_date,
      status: input.status,
      next_treatment: wantsReminder ? input.treatment : null,
      next_treatment_date: wantsReminder ? input.treatment_date : null,
      notes: input.notes,
      created_by: user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Treatment;
}

export async function updateTreatmentStatus(id: string, status: TreatmentStatus): Promise<void> {
  const db = requireClient();
  const { error } = await db.from('treatments').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}
