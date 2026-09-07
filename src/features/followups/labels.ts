import type { FollowUpPriority, FollowUpStatus } from './types';

type Tone = 'green' | 'gray' | 'amber' | 'sky' | 'red';

export const PRIORITY_META: Record<FollowUpPriority, { label: string; tone: Tone }> = {
  low: { label: 'Low', tone: 'gray' },
  medium: { label: 'Medium', tone: 'amber' },
  high: { label: 'High', tone: 'red' },
};

export const STATUS_META: Record<FollowUpStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'amber' },
  in_progress: { label: 'In progress', tone: 'sky' },
  completed: { label: 'Completed', tone: 'green' },
  cancelled: { label: 'Cancelled', tone: 'gray' },
};
