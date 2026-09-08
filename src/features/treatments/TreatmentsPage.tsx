import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/format';
import { listUpcomingTreatments } from './api';
import { TREATMENT_STATUS_META } from './labels';
import type { UpcomingTreatment } from './types';

export function TreatmentsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [rows, setRows] = useState<UpcomingTreatment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listUpcomingTreatments();
        if (active) setRows(data);
      } catch (err) {
        if (active) toast.error(err instanceof Error ? err.message : 'Could not load treatments.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [toast]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink-800">Treatments</h1>
        <p className="text-sm text-brand-ink-400">Scheduled next treatments &amp; reminders</p>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-7 w-7" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Stethoscope}
              title="No upcoming treatments."
              description="Next treatments recorded when completing an appointment appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-ink-100 text-xs uppercase tracking-wide text-brand-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Next treatment</th>
                  <th className="px-4 py-3 font-medium">Due date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last treatment</th>
                  <th className="px-4 py-3 font-medium">Reminder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-ink-50">
                {rows.map((t) => (
                  <tr key={t.id} className="hover:bg-brand-ink-50/50">
                    <td className="px-4 py-3">
                      <button
                        className="font-medium text-brand-ink-800 hover:text-brand-green-700"
                        onClick={() => navigate(`/patients/${t.patient_id}`)}
                      >
                        {t.patients?.full_name ?? '—'}
                      </button>
                      <div className="text-xs text-brand-ink-400">{t.patients?.phone ?? ''}</div>
                    </td>
                    <td className="px-4 py-3 text-brand-ink-700">{t.next_treatment ?? '—'}</td>
                    <td className="px-4 py-3 text-brand-ink-600">{formatDate(t.next_treatment_date)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={TREATMENT_STATUS_META[t.status].tone}>
                        {TREATMENT_STATUS_META[t.status].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-brand-ink-600">{formatDate(t.treatment_date)}</td>
                    <td className="px-4 py-3">
                      {t.treatment_reminder_sent ? (
                        <Badge tone="green">Sent</Badge>
                      ) : (
                        <Badge tone="gray">Pending</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
