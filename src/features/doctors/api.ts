import { supabase } from '@/lib/supabase';
import type { Doctor, DoctorInput } from './types';

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

/** All doctors (admin management list). */
export async function listDoctors(): Promise<Doctor[]> {
  const { data, error } = await requireClient()
    .from('doctors')
    .select('*')
    .order('full_name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Doctor[];
}

/** Active doctors only, for dropdowns. */
export async function listActiveDoctors(): Promise<Doctor[]> {
  const { data, error } = await requireClient()
    .from('doctors')
    .select('*')
    .eq('is_active', true)
    .order('full_name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Doctor[];
}

export async function createDoctor(input: DoctorInput): Promise<Doctor> {
  const { data, error } = await requireClient().from('doctors').insert(input).select().single();
  if (error) throw new Error(error.message);
  return data as Doctor;
}

export async function updateDoctor(id: string, input: DoctorInput): Promise<Doctor> {
  const { data, error } = await requireClient()
    .from('doctors')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Doctor;
}

export async function setDoctorActive(id: string, is_active: boolean): Promise<void> {
  const { error } = await requireClient().from('doctors').update({ is_active }).eq('id', id);
  if (error) throw new Error(error.message);
}
