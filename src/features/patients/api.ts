import { supabase } from '@/lib/supabase';
import type { Patient, PatientInput, PatientOverview } from './types';

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export interface ListParams {
  search?: string;
  page?: number; // 1-based
  pageSize?: number;
}

export interface ListResult {
  rows: PatientOverview[];
  total: number;
}

export async function listPatients({
  search = '',
  page = 1,
  pageSize = 10,
}: ListParams): Promise<ListResult> {
  const db = requireClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = db
    .from('patient_overview')
    .select('*', { count: 'exact' })
    .order('full_name', { ascending: true })
    .range(from, to);

  const term = search.trim();
  if (term) {
    const like = `%${term}%`;
    query = query.or(`full_name.ilike.${like},phone.ilike.${like}`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as PatientOverview[], total: count ?? 0 };
}

export async function getPatient(id: string): Promise<Patient> {
  const db = requireClient();
  const { data, error } = await db.from('patients').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data as Patient;
}

export async function createPatient(input: PatientInput): Promise<Patient> {
  const db = requireClient();
  const {
    data: { user },
  } = await db.auth.getUser();

  const { data, error } = await db
    .from('patients')
    .insert({ ...input, created_by: user?.id ?? null })
    .select()
    .single();

  if (error) throw mapPatientError(error);
  return data as Patient;
}

export async function updatePatient(id: string, input: PatientInput): Promise<Patient> {
  const db = requireClient();
  const { data, error } = await db.from('patients').update(input).eq('id', id).select().single();
  if (error) throw mapPatientError(error);
  return data as Patient;
}

/** All existing normalized phones, for CSV dedupe. */
export async function fetchExistingPhones(): Promise<Set<string>> {
  const db = requireClient();
  const { data, error } = await db.from('patients').select('phone');
  if (error) throw new Error(error.message);
  return new Set((data ?? []).map((r) => r.phone as string));
}

export interface ImportRow {
  full_name: string;
  phone: string;
  email: string | null;
  preferred_language: 'en' | 'ar';
}

/** Bulk-insert patients, ignoring any phone that already exists. */
export async function importPatients(rows: ImportRow[]): Promise<{ imported: number }> {
  const db = requireClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  const payload = rows.map((r) => ({ ...r, created_by: user?.id ?? null }));
  const { data, error } = await db
    .from('patients')
    .upsert(payload, { onConflict: 'phone', ignoreDuplicates: true })
    .select('id');
  if (error) throw new Error(error.message);
  return { imported: data?.length ?? 0 };
}

function mapPatientError(error: { code?: string; message: string }): Error {
  // 23505 = unique_violation (phone already exists)
  if (error.code === '23505') {
    return new Error('A patient with this phone number already exists.');
  }
  return new Error(error.message);
}
