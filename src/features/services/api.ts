import { supabase } from '@/lib/supabase';
import type { Service, ServiceInput } from './types';

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

/** All services (admin management list). */
export async function listServices(): Promise<Service[]> {
  const { data, error } = await requireClient()
    .from('services')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Service[];
}

/** Active services only, for dropdowns. */
export async function listActiveServices(): Promise<Service[]> {
  const { data, error } = await requireClient()
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Service[];
}

export async function createService(input: ServiceInput): Promise<Service> {
  const { data, error } = await requireClient().from('services').insert(input).select().single();
  if (error) throw new Error(error.message);
  return data as Service;
}

export async function updateService(id: string, input: ServiceInput): Promise<Service> {
  const { data, error } = await requireClient()
    .from('services')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Service;
}

export async function setServiceActive(id: string, is_active: boolean): Promise<void> {
  const { error } = await requireClient().from('services').update({ is_active }).eq('id', id);
  if (error) throw new Error(error.message);
}
