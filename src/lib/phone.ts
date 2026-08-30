/**
 * Phone normalization for WhatsApp (spec §22). Produces E.164 (e.g. +9745XXXXXXX).
 * Default country is Qatar (+974) for local 8-digit numbers.
 */
const DEFAULT_COUNTRY_CODE = '974'; // Qatar

export function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  let s = raw.trim().replace(/[\s()\-.]/g, '');

  if (s.startsWith('00')) s = '+' + s.slice(2);

  if (s.startsWith('+')) {
    const digits = s.slice(1).replace(/\D/g, '');
    return isValidE164Digits(digits) ? '+' + digits : null;
  }

  const digits = s.replace(/\D/g, '');
  if (!digits) return null;

  // Local 8-digit Qatar number → prepend country code.
  if (digits.length === 8) return '+' + DEFAULT_COUNTRY_CODE + digits;

  // Already includes a country code.
  return isValidE164Digits(digits) ? '+' + digits : null;
}

function isValidE164Digits(digits: string): boolean {
  return /^\d{8,15}$/.test(digits);
}

export function isValidPhone(raw: string): boolean {
  return normalizePhone(raw) !== null;
}

/** Light formatting for display; falls back to the raw value. */
export function formatPhone(e164: string | null | undefined): string {
  return e164 ?? '—';
}
