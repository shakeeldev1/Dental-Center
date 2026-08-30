import { useCallback, useEffect, useState } from 'react';
import { MessageCircle, ArrowDownLeft } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime } from '@/lib/format';
import { listPatientMessages } from './api';
import { TYPE_LABEL, STATUS_TONE } from './labels';
import type { WhatsappMessage } from './types';

export function PatientWhatsappSection({
  patientId,
  refreshKey = 0,
}: {
  patientId: string;
  refreshKey?: number;
}) {
  const toast = useToast();
  const [rows, setRows] = useState<WhatsappMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listPatientMessages(patientId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load messages.');
    } finally {
      setLoading(false);
    }
  }, [patientId, toast]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-brand-ink-700">WhatsApp history</h2>
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={MessageCircle} title="No messages yet." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand-ink-100 text-xs uppercase tracking-wide text-brand-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-ink-50">
              {rows.map((m) => (
                <tr key={m.id} className="align-top hover:bg-brand-ink-50/50">
                  <td className="whitespace-nowrap px-4 py-3 text-brand-ink-600">
                    {formatDateTime(m.created_at)}
                  </td>
                  <td className="px-4 py-3 text-brand-ink-600">
                    {TYPE_LABEL[m.message_type]}
                    {m.direction === 'inbound' && (
                      <span className="ml-2 inline-flex items-center gap-0.5 text-xs text-brand-ink-400">
                        <ArrowDownLeft className="h-3 w-3" /> in
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[m.status]}>{m.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-brand-ink-500">
                    {m.error_message ? (
                      <span className="text-red-600">{m.error_message}</span>
                    ) : (
                      (m.body ?? '—').slice(0, 60)
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
