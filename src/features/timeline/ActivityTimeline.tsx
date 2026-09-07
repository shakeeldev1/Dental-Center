import { useCallback, useEffect, useState } from 'react';
import {
  UserPlus,
  CalendarClock,
  CalendarCheck,
  CalendarSync,
  CalendarX,
  CalendarCheck2,
  UserX,
  MessageCircle,
  MessageCircleReply,
  Star,
  ListChecks,
  Megaphone,
  History,
} from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime } from '@/lib/format';
import { listActivityForPatient } from './api';
import type { ActivityEventType, ActivityLogEntry } from './types';

const EVENT_META: Record<ActivityEventType, { label: string; icon: typeof History }> = {
  customer_created: { label: 'Customer created', icon: UserPlus },
  appointment_requested: { label: 'Appointment requested', icon: CalendarClock },
  appointment_confirmed: { label: 'Appointment confirmed', icon: CalendarCheck },
  appointment_rescheduled: { label: 'Appointment rescheduled', icon: CalendarSync },
  appointment_cancelled: { label: 'Appointment cancelled', icon: CalendarX },
  appointment_completed: { label: 'Appointment completed', icon: CalendarCheck2 },
  appointment_no_show: { label: 'No show', icon: UserX },
  whatsapp_sent: { label: 'WhatsApp sent', icon: MessageCircle },
  whatsapp_reply: { label: 'WhatsApp reply', icon: MessageCircleReply },
  review_request_sent: { label: 'Review request sent', icon: Star },
  follow_up_created: { label: 'Follow-up created', icon: ListChecks },
  campaign_sent: { label: 'Campaign sent', icon: Megaphone },
};

export function ActivityTimeline({ patientId }: { patientId: string }) {
  const toast = useToast();
  const [rows, setRows] = useState<ActivityLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { rows, hasMore } = await listActivityForPatient(patientId, 1);
      setRows(rows);
      setHasMore(hasMore);
      setPage(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load timeline.');
    } finally {
      setLoading(false);
    }
  }, [patientId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const { rows: more, hasMore: hm } = await listActivityForPatient(patientId, next);
      setRows((r) => [...r, ...more]);
      setHasMore(hm);
      setPage(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load more.');
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-brand-ink-700">Timeline</h2>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={History} title="No activity yet." />
      ) : (
        <div className="card divide-y divide-brand-ink-50">
          {rows.map((entry) => {
            const meta = EVENT_META[entry.event_type] ?? { label: entry.event_type, icon: History };
            const Icon = meta.icon;
            return (
              <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-brand-ink-800">{meta.label}</p>
                  <p className="text-xs text-brand-ink-500">{entry.description}</p>
                </div>
                <span className="whitespace-nowrap text-xs text-brand-ink-400">
                  {formatDateTime(entry.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => void loadMore()} loading={loadingMore}>
            Load more
          </Button>
        </div>
      )}
    </section>
  );
}
