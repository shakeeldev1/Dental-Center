import Papa from 'papaparse';
import { normalizePhone } from '@/lib/phone';

export type ContactRowStatus = 'valid' | 'invalid' | 'duplicate';

export interface ParsedContact {
  name: string;
  phone: string | null; // normalized E.164
  status: ContactRowStatus;
  reason?: string;
}

export interface ContactsPreview {
  rows: ParsedContact[];
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
}

const NAME_KEYS = ['name', 'full_name', 'fullname', 'contact', 'patient_name'];
const PHONE_KEYS = ['phone', 'whatsapp', 'number', 'mobile', 'phone_number', 'contact_number'];

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

/** Classify parsed rows for a campaign contact list. Only phone is required. */
export function classifyContactRows(rawRows: Record<string, unknown>[]): ContactsPreview {
  const seen = new Set<string>();
  const rows: ParsedContact[] = rawRows.map((raw) => {
    const name = pick(raw, NAME_KEYS);
    const rawPhone = pick(raw, PHONE_KEYS);
    const phone = rawPhone ? normalizePhone(rawPhone) : null;

    let status: ContactRowStatus;
    let reason: string | undefined;
    if (!phone) {
      status = 'invalid';
      reason = 'Invalid phone';
    } else if (seen.has(phone)) {
      status = 'duplicate';
      reason = 'Duplicate phone';
    } else {
      status = 'valid';
      seen.add(phone);
    }
    return { name, phone, status, reason };
  });

  return {
    rows,
    total: rows.length,
    valid: rows.filter((r) => r.status === 'valid').length,
    invalid: rows.filter((r) => r.status === 'invalid').length,
    duplicates: rows.filter((r) => r.status === 'duplicate').length,
  };
}
