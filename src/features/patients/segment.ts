import { supabase } from '@/lib/supabase';
import type { CustomerStatus, CustomerType, LeadSource } from './types';
import type { AppointmentStatus } from '@/features/appointments/types';

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

/** Marketing segmentation filters (spec §18) — every present key narrows the audience further. */
export interface SegmentFilters {
  doctor_id?: string;
  service_id?: string;
  lead_source?: LeadSource[];
  customer_type?: CustomerType;
  customer_status?: CustomerStatus[];
  last_appointment_status?: AppointmentStatus[];
  has_no_show?: boolean;
  has_completed?: boolean;
  review_requested?: boolean;
  created_after?: string;
  created_before?: string;
  last_contact_after?: string;
  last_contact_before?: string;
}

export function isEmptySegmentFilters(f: SegmentFilters): boolean {
  return Object.values(f).every((v) => v === undefined || v === '' || (Array.isArray(v) && v.length === 0));
}

export interface SegmentRow {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  customer_type: CustomerType;
  customer_status: CustomerStatus;
  lead_source: LeadSource | null;
  family_name: string | null;
  preferred_doctor_name: string | null;
  preferred_service_name: string | null;
  last_appointment_status: AppointmentStatus | null;
  last_appointment_at: string | null;
  has_no_show: boolean;
  has_completed: boolean;
  review_requested: boolean;
  last_contact_at: string | null;
  created_at: string;
}

export interface ListSegmentResult {
  rows: SegmentRow[];
  total: number;
}

export async function listPatientsBySegment(
  filters: SegmentFilters,
  { page = 1, pageSize = 10 }: { page?: number; pageSize?: number } = {},
): Promise<ListSegmentResult> {
  const db = requireClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = db.from('patient_segment_view').select('*', { count: 'exact' }).range(from, to);
  query = applySegmentFilters(query, filters);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as SegmentRow[], total: count ?? 0 };
}

/** Shared with the campaign "Segment" audience preview so counts stay consistent. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applySegmentFilters(query: any, f: SegmentFilters): any {
  if (f.doctor_id) query = query.eq('preferred_doctor_id', f.doctor_id);
  if (f.service_id) query = query.eq('preferred_service_id', f.service_id);
  if (f.lead_source?.length) query = query.in('lead_source', f.lead_source);
  if (f.customer_type) query = query.eq('customer_type', f.customer_type);
  if (f.customer_status?.length) query = query.in('customer_status', f.customer_status);
  if (f.last_appointment_status?.length) query = query.in('last_appointment_status', f.last_appointment_status);
  if (typeof f.has_no_show === 'boolean') query = query.eq('has_no_show', f.has_no_show);
  if (typeof f.has_completed === 'boolean') query = query.eq('has_completed', f.has_completed);
  if (typeof f.review_requested === 'boolean') query = query.eq('review_requested', f.review_requested);
  if (f.created_after) query = query.gte('created_at', f.created_after);
  if (f.created_before) query = query.lte('created_at', f.created_before);
  if (f.last_contact_after) query = query.gte('last_contact_at', f.last_contact_after);
  if (f.last_contact_before) query = query.lte('last_contact_at', f.last_contact_before);
  return query;
}
