import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { listPatients } from '@/features/patients/api';
import type { PatientOverview } from '@/features/patients/types';

export interface PickedPatient {
  id: string;
  full_name: string;
  phone: string;
}

interface PatientPickerProps {
  value: PickedPatient | null;
  onChange: (patient: PickedPatient | null) => void;
  disabled?: boolean;
}

export function PatientPicker({ value, onChange, disabled }: PatientPickerProps) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<PatientOverview[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value || !open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const { rows } = await listPatients({ search: term, page: 1, pageSize: 8 });
        setResults(rows);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [term, open, value]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-brand-ink-200 bg-brand-ink-50 px-3 py-2">
        <div className="text-sm">
          <span className="font-medium text-brand-ink-800">{value.full_name}</span>
          <span className="ml-2 text-brand-ink-500">{value.phone}</span>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-brand-ink-400 hover:text-brand-ink-700"
            aria-label="Clear patient"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={boxRef}>
      <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-brand-ink-400" />
      <input
        className="input pl-9"
        placeholder="Search patient by name or phone…"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onFocus={() => setOpen(true)}
        disabled={disabled}
      />
      {open && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-brand-ink-100 bg-white shadow-card">
          {loading ? (
            <div className="px-3 py-3 text-sm text-brand-ink-400">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-3 text-sm text-brand-ink-400">
              {term ? 'No patients found.' : 'Type to search patients.'}
            </div>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-brand-ink-50"
                onClick={() => {
                  onChange({ id: p.id, full_name: p.full_name, phone: p.phone });
                  setOpen(false);
                  setTerm('');
                }}
              >
                <span className="font-medium text-brand-ink-800">{p.full_name}</span>
                <span className="text-brand-ink-500">{p.phone}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
