import type { WaMessageStatus, WaMessageType } from './types';

type Tone = 'green' | 'gray' | 'amber' | 'sky' | 'red';

export const TYPE_LABEL: Record<WaMessageType, string> = {
  confirmation: 'Confirmation',
  reminder_24h: '24h Reminder',
  reminder_2h: '2h Reminder',
  review: 'Review',
  treatment_reminder: 'Treatment Reminder',
  campaign: 'Campaign',
  manual: 'Manual',
};

export const STATUS_TONE: Record<WaMessageStatus, Tone> = {
  sent: 'green',
  failed: 'red',
  pending: 'amber',
};

export const TYPE_FILTERS: { value: WaMessageType | 'all'; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'confirmation', label: 'Confirmation' },
  { value: 'reminder_24h', label: '24h Reminder' },
  { value: 'reminder_2h', label: '2h Reminder' },
  { value: 'review', label: 'Review' },
  { value: 'treatment_reminder', label: 'Treatment Reminder' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'manual', label: 'Manual' },
];

export const STATUS_FILTERS: { value: WaMessageStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
];
