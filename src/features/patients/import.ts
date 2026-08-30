import Papa from 'papaparse';
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

const NAME_KEYS = ['name', 'full_name', 'fullname', 'patient', 'patient_name'];
const PHONE_KEYS = ['phone', 'whatsapp', 'number', 'mobile', 'phone_number', 'contact'];
const EMAIL_KEYS = ['email', 'e-mail', 'mail'];
const LANG_KEYS = ['preferred_language', 'language', 'lang'];

function pick(row: Record<string, unknown>, keys: string[]): string {
  for (const k of Object.keys(row)) {
    if (keys.includes(k.trim().toLowerCase())) return String(row[k] ?? '').trim();
  }
  return '';
}

export function parseCsv(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => resolve(res.data as Record<string, unknown>[]),
      error: reject,
    });
  });
}

/** Classify parsed rows against phones already in the DB (spec §22). */
export function classifyRows(
  rawRows: Record<string, unknown>[],
  existingPhones: Set<string>,
): ImportPreview {
  const seen = new Set<string>();
  const rows: ParsedPatient[] = rawRows.map((raw) => {
    const full_name = pick(raw, NAME_KEYS);
    const rawPhone = pick(raw, PHONE_KEYS);
    const email = pick(raw, EMAIL_KEYS) || null;
    const langRaw = pick(raw, LANG_KEYS).toLowerCase();
    const preferred_language: LanguageCode = langRaw.startsWith('ar') ? 'ar' : 'en';
    const phone = rawPhone ? normalizePhone(rawPhone) : null;

    let status: RowStatus;
    let reason: string | undefined;
    if (!full_name) {
      status = 'invalid';
      reason = 'Missing name';
    } else if (!phone) {
      status = 'invalid';
      reason = 'Invalid phone';
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
