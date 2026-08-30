import { supabase } from '@/lib/supabase';
import { apiFetch } from '@/lib/api';
import type { WhatsappMessage, WaMessageStatus, WaMessageType } from './types';

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export interface ListParams {
  type?: WaMessageType | 'all';
  status?: WaMessageStatus | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface ListResult {
  rows: WhatsappMessage[];
  total: number;
}

export async function listMessages({
  type = 'all',
  status = 'all',
  search = '',
  page = 1,
  pageSize = 20,
}: ListParams): Promise<ListResult> {
  const db = requireClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = db
    .from('whatsapp_message_details')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (type !== 'all') query = query.eq('message_type', type);
  if (status !== 'all') query = query.eq('status', status);

  const term = search.trim();
  if (term) {
    const like = `%${term}%`;
    query = query.or(`patient_name.ilike.${like},phone.ilike.${like}`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as WhatsappMessage[], total: count ?? 0 };
}

export async function listPatientMessages(patientId: string): Promise<WhatsappMessage[]> {
  const db = requireClient();
  const { data, error } = await db
    .from('whatsapp_message_details')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as WhatsappMessage[];
}

export interface SendManualResult {
  ok: boolean;
  error: string | null;
  messageId: string | null;
}

/** Send an individual WhatsApp message via the backend (server holds creds). */
export async function sendManualMessage(patientId: string, message: string): Promise<SendManualResult> {
  return apiFetch<SendManualResult>('/whatsapp/send', {
    method: 'POST',
    body: JSON.stringify({ patientId, message }),
  });
}
