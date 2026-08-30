import type { AppointmentStatus } from './types';

type Tone = 'green' | 'gray' | 'amber' | 'sky' | 'red';

export const STATUS_META: Record<AppointmentStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'amber' },
  confirmed: { label: 'Confirmed', tone: 'green' },
  completed: { label: 'Completed', tone: 'sky' },
  cancelled: { label: 'Cancelled', tone: 'gray' },
  no_show: { label: 'No show', tone: 'red' },
};

export interface StatusAction {
  to: AppointmentStatus;
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
}

/** Allowed status transitions from the current status (spec §9, §10). */
export const STATUS_ACTIONS: Record<AppointmentStatus, StatusAction[]> = {
  pending: [
    { to: 'confirmed', label: 'Confirm', variant: 'primary' },
    { to: 'completed', label: 'Complete', variant: 'secondary' },
    { to: 'no_show', label: 'No-show', variant: 'secondary' },
    { to: 'cancelled', label: 'Cancel', variant: 'danger' },
  ],
  confirmed: [
    { to: 'completed', label: 'Complete', variant: 'primary' },
    { to: 'no_show', label: 'No-show', variant: 'secondary' },
    { to: 'cancelled', label: 'Cancel', variant: 'danger' },
  ],
  completed: [],
  cancelled: [{ to: 'pending', label: 'Reopen', variant: 'secondary' }],
  no_show: [{ to: 'pending', label: 'Reopen', variant: 'secondary' }],
};

export const STATUS_FILTERS: { value: AppointmentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No show' },
];
