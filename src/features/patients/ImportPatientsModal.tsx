import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { parseCsv, classifyRows, type ImportPreview } from './import';
import { fetchExistingPhones, importPatients } from './api';

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

type Step = 'select' | 'preview' | 'result';

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

export function ImportPatientsModal({ open, onClose, onImported }: Props) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('select');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  function reset() {
    setStep('select');
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
      const [rows, existing] = await Promise.all([parseCsv(file), fetchExistingPhones()]);
      setPreview(classifyRows(rows, existing));
      setStep('preview');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not parse CSV.');
    } finally {
      setBusy(false);
    }
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
        step === 'preview' ? (
          <>
            <Button variant="secondary" onClick={reset} disabled={busy}>
              Choose another file
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
            Required columns: <code>name</code>, <code>phone</code>. Optional: <code>email</code>,{' '}
            <code>preferred_language</code>. Phone numbers are normalized (Qatar +974) and
            de-duplicated. (<code>last_visit</code> / <code>treatment</code> columns are ignored in
            this version.)
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
