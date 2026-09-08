import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { parseCsv, classifyRows, guessMapping, type ImportPreview, type ColumnMapping } from './import';
import { fetchExistingPhones, importPatients } from './api';

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

type Step = 'select' | 'mapping' | 'preview' | 'result';

interface Result {
  imported: number;
  skipped: number;
  invalid: number;
  duplicates: number;
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-brand-ink-100 p-3 text-center">
      <p className={`text-xl font-bold ${tone}`}>{value}</p>
      <p className="text-xs text-brand-ink-400">{label}</p>
    </div>
  );
}

const NONE = '__none__';

export function ImportPatientsModal({ open, onClose, onImported }: Props) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('select');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({ name: null, phone: null, email: null, language: null });
  const [existingPhones, setExistingPhones] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  function reset() {
    setStep('select');
    setHeaders([]);
    setRawRows([]);
    setMapping({ name: null, phone: null, email: null, language: null });
    setPreview(null);
    setResult(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const [{ rawRows, headers }, existing] = await Promise.all([parseCsv(file), fetchExistingPhones()]);
      setRawRows(rawRows);
      setHeaders(headers);
      setExistingPhones(existing);
      const guess = guessMapping(headers);
      setMapping(guess);
      if (!guess.name || !guess.phone) {
        setStep('mapping');
      } else {
        setPreview(classifyRows(rawRows, guess, existing));
        setStep('preview');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not parse CSV.');
    } finally {
      setBusy(false);
    }
  }

  function confirmMapping() {
    if (!mapping.name || !mapping.phone) {
      toast.error('Select which columns contain the name and phone number.');
      return;
    }
    setPreview(classifyRows(rawRows, mapping, existingPhones));
    setStep('preview');
  }

  async function handleImport() {
    if (!preview) return;
    const validRows = preview.rows
      .filter((r) => r.status === 'valid' && r.phone)
      .map((r) => ({
        full_name: r.full_name,
        phone: r.phone as string,
        email: r.email,
        preferred_language: r.preferred_language,
      }));
    setBusy(true);
    try {
      const { imported } = await importPatients(validRows);
      setResult({
        imported,
        skipped: validRows.length - imported,
        invalid: preview.invalid,
        duplicates: preview.duplicates,
      });
      setStep('result');
      onImported();
      toast.success(`Imported ${imported} patient${imported === 1 ? '' : 's'}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setBusy(false);
    }
  }

  const previewRows = preview?.rows.slice(0, 50) ?? [];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import patients from CSV"
      footer={
        step === 'mapping' ? (
          <>
            <Button variant="secondary" onClick={reset} disabled={busy}>
              Choose another file
            </Button>
            <Button onClick={confirmMapping} disabled={busy}>
              Continue
            </Button>
          </>
        ) : step === 'preview' ? (
          <>
            <Button variant="secondary" onClick={() => setStep('mapping')} disabled={busy}>
              Remap columns
            </Button>
            <Button onClick={handleImport} loading={busy} disabled={!preview || preview.valid === 0}>
              Import {preview?.valid ?? 0} patient{preview?.valid === 1 ? '' : 's'}
            </Button>
          </>
        ) : step === 'result' ? (
          <Button onClick={handleClose}>Done</Button>
        ) : undefined
      }
    >
      {step === 'select' && (
        <div className="space-y-4">
          <p className="text-sm text-brand-ink-500">
            Any column order works — we auto-detect Name, Phone and Email columns by header name, and
            let you confirm or remap them if we&apos;re not sure. Phone numbers are normalized (Qatar
            +974 for local numbers, or any international number with a country code) and de-duplicated.
            Arabic and other UTF-8 text is fully supported.
          </p>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-ink-200 py-10 hover:border-brand-green-400 hover:bg-brand-green-50/40"
          >
            <UploadCloud className="h-8 w-8 text-brand-ink-300" />
            <span className="text-sm font-medium text-brand-ink-700">
              {busy ? 'Reading…' : 'Choose a CSV file'}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
        </div>
      )}

      {step === 'mapping' && (
        <div className="space-y-4">
          <p className="text-sm text-brand-ink-500">
            We couldn&apos;t confidently detect every column from the header row. Please confirm which
            column holds each field ({rawRows.length} row{rawRows.length === 1 ? '' : 's'} found).
          </p>
          {(
            [
              ['name', 'Full name', true],
              ['phone', 'Phone', true],
              ['email', 'Email', false],
              ['language', 'Preferred language', false],
            ] as const
          ).map(([key, label, required]) => (
            <Field key={key} label={label} htmlFor={`map_${key}`} required={required}>
              <select
                id={`map_${key}`}
                className="input"
                value={mapping[key] ?? NONE}
                onChange={(e) =>
                  setMapping((m) => ({ ...m, [key]: e.target.value === NONE ? null : e.target.value }))
                }
              >
                <option value={NONE}>{required ? 'Select a column…' : 'None'}</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </Field>
          ))}
        </div>
      )}

      {step === 'preview' && preview && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <Stat label="Total" value={preview.total} tone="text-brand-ink-800" />
            <Stat label="Valid" value={preview.valid} tone="text-brand-green-700" />
            <Stat label="Duplicates" value={preview.duplicates} tone="text-amber-600" />
            <Stat label="Invalid" value={preview.invalid} tone="text-red-600" />
          </div>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-brand-ink-100">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white text-xs uppercase tracking-wide text-brand-ink-400">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Phone</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-ink-50">
                {previewRows.map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-brand-ink-700">{r.full_name || '—'}</td>
                    <td className="px-3 py-2 text-brand-ink-600">{r.phone ?? '—'}</td>
                    <td className="px-3 py-2">
                      <Badge
                        tone={
                          r.status === 'valid' ? 'green' : r.status === 'duplicate' ? 'amber' : 'red'
                        }
                      >
                        {r.status === 'valid' ? 'Valid' : r.reason}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.rows.length > 50 && (
            <p className="text-xs text-brand-ink-400">Showing first 50 of {preview.total} rows.</p>
          )}
        </div>
      )}

      {step === 'result' && result && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <Stat label="Imported" value={result.imported} tone="text-brand-green-700" />
            <Stat label="Skipped" value={result.skipped} tone="text-brand-ink-500" />
            <Stat label="Duplicates" value={result.duplicates} tone="text-amber-600" />
            <Stat label="Invalid" value={result.invalid} tone="text-red-600" />
          </div>
          <p className="text-sm text-brand-ink-500">
            Import complete. Duplicates and invalid rows were not imported.
          </p>
        </div>
      )}
    </Modal>
  );
}
