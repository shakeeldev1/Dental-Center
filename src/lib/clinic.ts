/**
 * Clinic timezone helpers. Qatar has no DST, so a fixed +03:00 offset is safe
 * and keeps appointment times unambiguous regardless of the user's browser tz.
 */
export const CLINIC_TZ = 'Asia/Qatar';
const CLINIC_OFFSET = '+03:00';

/** Combine a date (YYYY-MM-DD) and time (HH:mm) into a clinic-time ISO string. */
export function toClinicISO(date: string, time: string): string {
  return `${date}T${time}:00${CLINIC_OFFSET}`;
}

/** Split a timestamptz back into { date, time } as seen in clinic time. */
export function fromClinicISO(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: CLINIC_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  return { date, time };
}

/** Today's date (YYYY-MM-DD) in clinic time. */
export function clinicToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Start/end of a clinic day as ISO instants. */
export function clinicDayRange(date: string): { start: string; end: string } {
  return { start: `${date}T00:00:00${CLINIC_OFFSET}`, end: `${date}T23:59:59${CLINIC_OFFSET}` };
}
