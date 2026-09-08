import { supabase } from '@/lib/supabase';
import type { LanguageCode } from '@/types';

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export interface Settings {
  clinic_name: string;
  clinic_timezone: string;
  google_review_url: string | null;
  default_language: LanguageCode;
  reminder_24h_enabled: boolean;
  reminder_2h_enabled: boolean;
  reminder_1_hours_before: number;
  reminder_2_hours_before: number;
  treatment_reminder_enabled: boolean;
  treatment_reminder_days: number;
  campaign_daily_limit: number;
  campaign_send_interval_seconds: number;
}

export interface Template {
  id: string;
  template_key: string;
  language: LanguageCode;
  body: string;
}

export async function getSettings(): Promise<Settings> {
  const { data, error } = await requireClient().from('settings').select('*').limit(1).single();
  if (error) throw new Error(error.message);
  return data as Settings;
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const { error } = await requireClient().from('settings').update(patch).eq('id', true);
  if (error) throw new Error(error.message);
}

export async function listTemplates(): Promise<Template[]> {
  const { data, error } = await requireClient()
    .from('message_templates')
    .select('id, template_key, language, body')
    .order('template_key', { ascending: true })
    .order('language', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Template[];
}

export async function updateTemplate(id: string, body: string): Promise<void> {
  const { error } = await requireClient().from('message_templates').update({ body }).eq('id', id);
  if (error) throw new Error(error.message);
}

export const TEMPLATE_LABEL: Record<string, string> = {
  appointment_confirmation: 'Appointment Confirmation',
  reminder_24h: '24h Reminder',
  reminder_2h: '2h Reminder',
  review_request: 'Review Request',
  treatment_reminder: 'Treatment Reminder',
  campaign: 'Campaign',
  no_show_followup: 'No-Show Follow-up',
};
