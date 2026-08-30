import { supabase } from '@/lib/supabase';
import type { Treatment, UpcomingTreatment } from './types';

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
