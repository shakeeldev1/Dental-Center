import { readCsvFile, guessColumns, guessColumnByHints, readField, type ColumnGuess } from '@/lib/csv';
import { normalizePhone } from '@/lib/phone';
import type { LanguageCode } from '@/types';

export type RowStatus = 'valid' | 'invalid' | 'duplicate';

export interface ParsedPatient {
  full_name: string;
  phone: string | null; // normalized E.164
  email: string | null;
  preferred_language: LanguageCode;
  status: RowStatus;
  reason?: string;
}

export interface ImportPreview {
  rows: ParsedPatient[];
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
}

export interface ColumnMapping {
  name: string | null;
  phone: string | null;
  email: string | null;
  language: string | null;
}

const LANG_HINTS = ['language', 'lang'];

export async function parseCsv(file: File): Promise<{ rawRows: Record<string, string>[]; headers: string[] }> {
  const { headers, rows } = await readCsvFile(file);
  if (headers.length === 0) throw new Error('Could not find a header row in this file.');
  return { rawRows: rows, headers };
}

/** Auto-detected column mapping; null fields mean the receptionist must confirm manually. */
export function guessMapping(headers: string[]): ColumnMapping {
  const g: ColumnGuess = guessColumns(headers);
  return {
    name: g.name,
    phone: g.phone,
    email: g.email,
    language: guessColumnByHints(headers, LANG_HINTS),
  };
}

/** Classify parsed rows against phones already in the DB (spec §22), using an explicit column mapping. */
export function classifyRows(
  rawRows: Record<string, unknown>[],
  mapping: ColumnMapping,
  existingPhones: Set<string>,
): ImportPreview {
  const seen = new Set<string>();
  const rows: ParsedPatient[] = rawRows.map((raw) => {
    const full_name = readField(raw, mapping.name);
    const rawPhone = readField(raw, mapping.phone);
    const email = readField(raw, mapping.email) || null;
    const langRaw = readField(raw, mapping.language).toLowerCase();
    const preferred_language: LanguageCode = langRaw.startsWith('ar') ? 'ar' : 'en';
    const phone = rawPhone ? normalizePhone(rawPhone) : null;

    let status: RowStatus;
    let reason: string | undefined;
    if (!full_name) {
      status = 'invalid';
      reason = 'Missing name';
    } else if (!rawPhone) {
      status = 'invalid';
      reason = 'Missing phone';
    } else if (!phone) {
      status = 'invalid';
      reason = `Invalid phone: "${rawPhone}"`;
    } else if (existingPhones.has(phone) || seen.has(phone)) {
      status = 'duplicate';
      reason = 'Duplicate phone';
    } else {
      status = 'valid';
      seen.add(phone);
    }
    return { full_name, phone, email, preferred_language, status, reason };
  });

  return {
    rows,
    total: rows.length,
    valid: rows.filter((r) => r.status === 'valid').length,
    invalid: rows.filter((r) => r.status === 'invalid').length,
    duplicates: rows.filter((r) => r.status === 'duplicate').length,
  };
}
