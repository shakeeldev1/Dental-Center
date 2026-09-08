import { readCsvFile, guessColumns, readField, type ColumnGuess } from '@/lib/csv';
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

export interface ContactColumnMapping {
  name: string | null;
  phone: string | null;
}

export async function parseCsv(file: File): Promise<{ rawRows: Record<string, string>[]; headers: string[] }> {
  const { headers, rows } = await readCsvFile(file);
  if (headers.length === 0) throw new Error('Could not find a header row in this file.');
  return { rawRows: rows, headers };
}

export function guessContactMapping(headers: string[]): ContactColumnMapping {
  const g: ColumnGuess = guessColumns(headers);
  return { name: g.name, phone: g.phone };
}

/** Classify parsed rows for a campaign contact list, using an explicit column mapping. Only phone is required. */
export function classifyContactRows(
  rawRows: Record<string, unknown>[],
  mapping: ContactColumnMapping,
): ContactsPreview {
  const seen = new Set<string>();
  const rows: ParsedContact[] = rawRows.map((raw) => {
    const name = readField(raw, mapping.name);
    const rawPhone = readField(raw, mapping.phone);
    const phone = rawPhone ? normalizePhone(rawPhone) : null;

    let status: ContactRowStatus;
    let reason: string | undefined;
    if (!rawPhone) {
      status = 'invalid';
      reason = 'Missing phone';
    } else if (!phone) {
      status = 'invalid';
      reason = `Invalid phone: "${rawPhone}"`;
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
