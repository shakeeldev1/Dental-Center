import { supabase } from '@/lib/supabase';
import { apiFetch } from '@/lib/api';
import type { Role } from '@/types';

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export interface StaffUser {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export async function listUsers(): Promise<StaffUser[]> {
  const { data, error } = await requireClient()
    .from('users')
    .select('id, email, full_name, role, is_active, created_at')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as StaffUser[];
}

export interface CreateUserInput {
  email: string;
  password: string;
  full_name: string;
  role: Role;
}

export async function createUser(input: CreateUserInput): Promise<StaffUser> {
  return apiFetch<StaffUser>('/users', { method: 'POST', body: JSON.stringify(input) });
}

export async function setUserActive(id: string, is_active: boolean): Promise<void> {
  const { error } = await requireClient().from('users').update({ is_active }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function setUserRole(id: string, role: Role): Promise<void> {
  const { error } = await requireClient().from('users').update({ role }).eq('id', id);
  if (error) throw new Error(error.message);
}
