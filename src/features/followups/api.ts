import { supabase } from '@/lib/supabase';
import { clinicToday } from '@/lib/clinic';
import type { FollowUp, FollowUpInput, FollowUpStatus, FollowUpWithPatient } from './types';

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export async function listPatientFollowUps(patientId: string): Promise<FollowUp[]> {
  const { data, error } = await requireClient()
    .from('follow_ups')
    .select('*')
    .eq('patient_id', patientId)
    .order('due_date', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as FollowUp[];
}

/** Open follow-up tasks due today, across all patients (dashboard/reception list). */
export async function listFollowUpsDueToday(): Promise<FollowUpWithPatient[]> {
  const { data, error } = await requireClient()
    .from('follow_ups')
    .select('*, patients(full_name, phone)')
    .eq('due_date', clinicToday())
    .eq('status', 'pending')
    .order('priority', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as FollowUpWithPatient[];
}

export async function createFollowUp(input: FollowUpInput): Promise<FollowUp> {
  const db = requireClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  const { data, error } = await db
    .from('follow_ups')
    .insert({ ...input, created_by: user?.id ?? null })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as FollowUp;
}

export async function setFollowUpStatus(id: string, status: FollowUpStatus): Promise<void> {
  const { error } = await requireClient().from('follow_ups').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}
