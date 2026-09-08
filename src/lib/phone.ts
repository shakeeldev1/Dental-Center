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

  // A leading trunk '0' (e.g. a domestic "07911123456") means this number has
  // no country code — treating it as one would silently produce an invalid
  // "+0…" number, so it's rejected rather than guessed at. Real E.164 country
  // codes never start with 0. International numbers must be entered with a
  // '+' or '00' country-code prefix (already handled above).
  if (digits.startsWith('0')) return null;

  // Otherwise assume it already includes a country code.
  return isValidE164Digits(digits) ? '+' + digits : null;
}

function isValidE164Digits(digits: string): boolean {
  return /^[1-9]\d{7,14}$/.test(digits);
}

export function isValidPhone(raw: string): boolean {
  return normalizePhone(raw) !== null;
}

/** Light formatting for display; falls back to the raw value. */
export function formatPhone(e164: string | null | undefined): string {
  return e164 ?? '—';
}
