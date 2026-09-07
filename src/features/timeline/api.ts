import { supabase } from '@/lib/supabase';
import type { ActivityLogEntry } from './types';

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

const PAGE_SIZE = 25;

/** Paginated (most-recent-first) — the log is unbounded, so callers should "load more" rather than fetch it all. */
export async function listActivityForPatient(
  patientId: string,
  page = 1,
): Promise<{ rows: ActivityLogEntry[]; hasMore: boolean }> {
  const db = requireClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE; // fetch one extra to detect "has more"
  const { data, error } = await db
    .from('activity_log')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as ActivityLogEntry[];
  return { rows: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE };
}
