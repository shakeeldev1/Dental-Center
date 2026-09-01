import { supabase } from '@/lib/supabase';
import { apiFetch } from '@/lib/api';
import type { AudienceType, Campaign } from './types';

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export async function listCampaigns(): Promise<Campaign[]> {
  const db = requireClient();
  const { data, error } = await db
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Campaign[];
}

export async function audienceCount(type: AudienceType): Promise<number> {
  const res = await apiFetch<{ count: number }>(`/campaigns/audience-count?type=${type}`);
  return res.count;
}

export interface CampaignRecipientInput {
  name: string | null;
  phone: string;
}

export interface CreateCampaignInput {
  name: string;
  offer?: string;
  message: string;
  audience_type: AudienceType;
  recipients?: CampaignRecipientInput[];
}

export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  return apiFetch<Campaign>('/campaigns', { method: 'POST', body: JSON.stringify(input) });
}

export async function sendCampaign(id: string): Promise<{ status: string; total: number }> {
  return apiFetch(`/campaigns/${id}/send`, { method: 'POST' });
}
