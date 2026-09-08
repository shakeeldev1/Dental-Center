import { useCallback, useEffect, useState } from 'react';
import { Stethoscope } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/format';
import { listPatientTreatments, updateTreatmentStatus } from './api';
import { TREATMENT_STATUS_META, TREATMENT_STATUSES } from './labels';
import type { Treatment, TreatmentStatus } from './types';

export function TreatmentHistorySection({
  patientId,
  refreshKey = 0,
}: {
  patientId: string;
  refreshKey?: number;
}) {
  const toast = useToast();
  const [rows, setRows] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listPatientTreatments(patientId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load treatments.');
    } finally {
      setLoading(false);
    }
  }, [patientId, toast]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function handleStatusChange(id: string, status: TreatmentStatus) {
    try {
      await updateTreatmentStatus(id, status);
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
      toast.success('Treatment status updated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update treatment status.');
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-brand-ink-700">Treatment history</h2>
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Stethoscope} title="No treatments yet." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand-ink-100 text-xs uppercase tracking-wide text-brand-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">Treatment</th>
                <th className="px-4 py-3 font-medium">Doctor</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Next treatment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-ink-50">
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-brand-ink-50/50">
                  <td className="px-4 py-3 text-brand-ink-700">{t.treatment}</td>
                  <td className="px-4 py-3 text-brand-ink-600">{t.doctor_name ?? '—'}</td>
                  <td className="px-4 py-3 text-brand-ink-600">{formatDate(t.treatment_date)}</td>
                  <td className="px-4 py-3">
                    <select
                      className="input w-auto py-1 text-xs"
                      value={t.status}
                      onChange={(e) => void handleStatusChange(t.id, e.target.value as TreatmentStatus)}
                    >
                      {TREATMENT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {TREATMENT_STATUS_META[s].label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-brand-ink-600">
                    {t.next_treatment ? (
                      <span>
                        {t.next_treatment}
                        {t.next_treatment_date && (
                          <span className="block text-xs text-brand-ink-400">
                            {formatDate(t.next_treatment_date)}
                          </span>
                        )}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
