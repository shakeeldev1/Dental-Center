import { supabase } from '@/lib/supabase';
import { clinicDayRange, clinicToday } from '@/lib/clinic';
import type { AppointmentDetails } from '@/features/appointments/types';

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export async function getTodayAppointments(): Promise<AppointmentDetails[]> {
  const db = requireClient();
  const { start, end } = clinicDayRange(clinicToday());
  const { data, error } = await db
    .from('appointment_details')
    .select('*')
    .gte('scheduled_at', start)
    .lte('scheduled_at', end)
    .order('scheduled_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as AppointmentDetails[];
}

export async function getUpcomingAppointments(limit = 5): Promise<AppointmentDetails[]> {
  const db = requireClient();
  const { data, error } = await db
    .from('appointment_details')
    .select('*')
    .gt('scheduled_at', new Date().toISOString())
    .in('status', ['requested', 'confirmed'])
    .order('scheduled_at', { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as AppointmentDetails[];
}

/** Leads not yet acted upon (patients.customer_status = 'new_lead'). */
export async function countNewLeads(): Promise<number> {
  const db = requireClient();
  const { count, error } = await db
    .from('patients')
    .select('id', { count: 'exact', head: true })
    .eq('customer_status', 'new_lead');
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Reception follow-up tasks due today and not yet done. */
export async function countFollowUpsDueToday(): Promise<number> {
  const db = requireClient();
  const { count, error } = await db
    .from('follow_ups')
    .select('id', { count: 'exact', head: true })
    .eq('due_date', clinicToday())
    .eq('status', 'pending');
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Review requests sent today (any appointment, regardless of its own scheduled date). */
export async function countReviewRequestsSentToday(): Promise<number> {
  const db = requireClient();
  const { start, end } = clinicDayRange(clinicToday());
  const { count, error } = await db
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('review_sent', true)
    .gte('review_sent_at', start)
    .lte('review_sent_at', end);
  if (error) throw new Error(error.message);
  return count ?? 0;
}
