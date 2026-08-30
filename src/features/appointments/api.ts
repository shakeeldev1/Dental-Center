import { supabase } from '@/lib/supabase';
import { apiFetch } from '@/lib/api';
import type { Appointment, AppointmentDetails, AppointmentInput, AppointmentStatus } from './types';

export interface ConfirmResult {
  ok: boolean;
  alreadySent: boolean;
  error: string | null;
}

/** Ask the backend to send the WhatsApp confirmation (server holds the creds). */
export async function confirmAppointment(id: string): Promise<ConfirmResult> {
  return apiFetch<ConfirmResult>(`/appointments/${id}/confirm`, { method: 'POST' });
}

export interface CompletePayload {
  treatment?: string;
  doctor_name?: string;
  next_treatment?: string;
  next_treatment_date?: string;
  notes?: string;
}

export interface CompleteResult {
  ok: boolean;
  review: { ok: boolean; alreadySent: boolean; error: string | null };
}

/** Complete an appointment: records treatment history + sends review (backend). */
export async function completeAppointment(
  id: string,
  payload: CompletePayload,
): Promise<CompleteResult> {
  return apiFetch<CompleteResult>(`/appointments/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export type DateScope = 'today' | 'upcoming' | 'all';

export interface ListParams {
  status?: AppointmentStatus | 'all';
  scope?: DateScope;
  date?: string; // specific clinic day (YYYY-MM-DD); overrides scope
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListResult {
  rows: AppointmentDetails[];
  total: number;
}

import { clinicDayRange, clinicToday } from '@/lib/clinic';

export async function listAppointments({
  status = 'all',
  scope = 'all',
  date,
  search = '',
  page = 1,
  pageSize = 15,
}: ListParams): Promise<ListResult> {
  const db = requireClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Upcoming shows nearest first; other views show most recent first.
  const ascending = scope === 'upcoming';
  let query = db
    .from('appointment_details')
    .select('*', { count: 'exact' })
    .order('scheduled_at', { ascending })
    .range(from, to);

  if (status !== 'all') query = query.eq('status', status);

  if (date) {
    const { start, end } = clinicDayRange(date);
    query = query.gte('scheduled_at', start).lte('scheduled_at', end);
  } else if (scope === 'today') {
    const { start, end } = clinicDayRange(clinicToday());
    query = query.gte('scheduled_at', start).lte('scheduled_at', end);
  } else if (scope === 'upcoming') {
    query = query.gte('scheduled_at', new Date().toISOString());
  }

  const term = search.trim();
  if (term) {
    const like = `%${term}%`;
    query = query.or(`patient_name.ilike.${like},patient_phone.ilike.${like}`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as AppointmentDetails[], total: count ?? 0 };
}

export async function listPatientAppointments(patientId: string): Promise<AppointmentDetails[]> {
  const db = requireClient();
  const { data, error } = await db
    .from('appointment_details')
    .select('*')
    .eq('patient_id', patientId)
    .order('scheduled_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AppointmentDetails[];
}

export async function createAppointment(input: AppointmentInput): Promise<Appointment> {
  const db = requireClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  const { data, error } = await db
    .from('appointments')
    .insert({ ...input, created_by: user?.id ?? null })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Appointment;
}

export async function updateAppointment(id: string, input: AppointmentInput): Promise<Appointment> {
  const db = requireClient();
  const { data, error } = await db
    .from('appointments')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Appointment;
}

export async function setAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  const db = requireClient();
  const { data, error } = await db
    .from('appointments')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Appointment;
}
