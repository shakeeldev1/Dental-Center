import type { TreatmentStatus } from './types';

type Tone = 'green' | 'gray' | 'amber' | 'sky' | 'red';

export const TREATMENT_STATUS_META: Record<TreatmentStatus, { label: string; tone: Tone }> = {
  planned: { label: 'Planned', tone: 'gray' },
  scheduled: { label: 'Scheduled', tone: 'amber' },
  in_progress: { label: 'In progress', tone: 'sky' },
  completed: { label: 'Completed', tone: 'green' },
  cancelled: { label: 'Cancelled', tone: 'red' },
};

export const TREATMENT_STATUSES: TreatmentStatus[] = [
  'planned',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
];
