import Papa from 'papaparse';

/**
 * Shared CSV reading + column auto-detection, used by both the patients CSV
 * import and the campaign "Custom list" CSV audience. Header-based parsing is
 * inherently column-order-independent; the real historical bug was exact-key
 * matching against a short hardcoded list (e.g. "Phone Number" never matched
 * "phone_number"). Matching is now done on a normalized key (BOM/whitespace/
 * punctuation/case stripped) with a substring-hint fallback, plus a manual
 * column-mapping escape hatch when auto-detection still can't find a
 * required column.
 */

export interface RawCsv {
  headers: string[];
  rows: Record<string, string>[];
}

export function readCsvFile(file: File): Promise<RawCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      encoding: 'UTF-8',
      transformHeader: (h) => h.replace(/^﻿/, '').trim(),
      complete: (res) => {
        if (res.errors?.length) {
          const fatal = res.errors.find((e) => e.type !== 'FieldMismatch');
          if (fatal) {
            reject(new Error(fatal.message));
            return;
          }
        }
        const headers = (res.meta.fields ?? []).map((h) => h.replace(/^﻿/, '').trim()).filter(Boolean);
        resolve({ headers, rows: res.data });
      },
      error: (err) => reject(err instanceof Error ? err : new Error(String(err))),
    });
  });
}

/** Strip BOM/case/whitespace/punctuation so "Phone Number", "phone_number" and "Phone-Number#" all match. */
export function normalizeKey(key: string): string {
  return key
    .replace(/^﻿/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export interface ColumnGuess {
  name: string | null;
  phone: string | null;
  email: string | null;
}

const NAME_CANDIDATES = [
  'name',
  'fullname',
  'patientname',
  'contactname',
  'customername',
  'clientname',
];
const PHONE_CANDIDATES = [
  'phone',
  'phonenumber',
  'mobile',
  'mobilenumber',
  'whatsapp',
  'whatsappnumber',
  'number',
  'contactnumber',
  'cellphone',
  'cell',
  'telephone',
  'tel',
];
const EMAIL_CANDIDATES = ['email', 'emailaddress', 'mail'];

const PHONE_HINTS = ['phone', 'mobile', 'whatsapp', 'contact', 'cell', 'tel'];
const NAME_HINTS = ['name'];
const EMAIL_HINTS = ['email', 'mail'];

/** Best-effort auto-detection of which raw header maps to name/phone/email. Returns null when unsure. */
export function guessColumns(headers: string[]): ColumnGuess {
  const normalized = headers.map((h) => ({ raw: h, norm: normalizeKey(h) }));
  const findExact = (candidates: string[]) =>
    normalized.find((h) => candidates.includes(h.norm))?.raw ?? null;
  const findHint = (hints: string[]) =>
    normalized.find((h) => hints.some((hint) => h.norm.includes(hint)))?.raw ?? null;

  return {
    name: findExact(NAME_CANDIDATES) ?? findHint(NAME_HINTS),
    phone: findExact(PHONE_CANDIDATES) ?? findHint(PHONE_HINTS),
    email: findExact(EMAIL_CANDIDATES) ?? findHint(EMAIL_HINTS),
  };
}

export function guessColumnByHints(headers: string[], hints: string[]): string | null {
  for (const h of headers) {
    if (hints.some((hint) => normalizeKey(h).includes(hint))) return h;
  }
  return null;
}

/** Read a field from a row by raw header name — never throws, treats missing/blank uniformly. */
export function readField(row: Record<string, unknown>, header: string | null): string {
  if (!header) return '';
  const v = row[header];
  return v === null || v === undefined ? '' : String(v).trim();
}
