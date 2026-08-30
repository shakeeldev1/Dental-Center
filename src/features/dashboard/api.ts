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
    .in('status', ['pending', 'confirmed'])
    .order('scheduled_at', { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as AppointmentDetails[];
}
