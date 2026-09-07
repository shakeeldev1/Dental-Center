import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, CalendarDays, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatTime } from '@/lib/format';
import { listAppointments, setAppointmentStatus, markAppointmentNoShow, type DateScope } from './api';
import { STATUS_META, STATUS_FILTERS } from './status';
import { AppointmentForm } from './AppointmentForm';
import { AppointmentActions } from './AppointmentActions';
import { CompleteAppointmentModal } from './CompleteAppointmentModal';
import type { AppointmentDetails, AppointmentStatus } from './types';

const PAGE_SIZE = 15;
const SCOPES: { value: DateScope; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'all', label: 'All' },
];

export function AppointmentsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [rows, setRows] = useState<AppointmentDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [scope, setScope] = useState<DateScope>('today');
  const [status, setStatus] = useState<AppointmentStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AppointmentDetails | null>(null);
  const [completeFor, setCompleteFor] = useState<AppointmentDetails | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { rows, total } = await listAppointments({
        scope,
        status,
        search: debounced,
        page,
        pageSize: PAGE_SIZE,
      });
      setRows(rows);
      setTotal(total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load appointments.');
    } finally {
      setLoading(false);
    }
  }, [scope, status, debounced, page, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleStatus(a: AppointmentDetails, next: AppointmentStatus) {
    try {
      await setAppointmentStatus(a.id, next);
      toast.success(`Marked ${STATUS_META[next].label.toLowerCase()}.`);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update status.');
    }
  }

  async function handleNoShow(a: AppointmentDetails) {
    try {
      const res = await markAppointmentNoShow(a.id);
      toast.success('Marked no show.');
      if (res.whatsapp.ok) toast.success('WhatsApp follow-up sent.');
      else toast.error(`Follow-up message not sent: ${res.whatsapp.error ?? 'unknown error'}`);
      if (res.followUpCreated) toast.success('Reception follow-up task created.');
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not mark no show.');
    }
  }

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink-800">Appointments</h1>
          <p className="text-sm text-brand-ink-400">{total} in view</p>
        </div>
        <Button onClick={openNew}>
          <CalendarPlus className="h-4 w-4" />
          New appointment
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-brand-ink-200 bg-white p-0.5">
          {SCOPES.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                setScope(s.value);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                scope === s.value
                  ? 'bg-brand-green-500 text-white'
                  : 'text-brand-ink-500 hover:text-brand-ink-800'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <select
          className="input w-auto"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as AppointmentStatus | 'all');
            setPage(1);
          }}
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-brand-ink-400" />
          <input
            className="input pl-9"
            placeholder="Search patient…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-7 w-7" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={CalendarDays}
              title={
                scope === 'today'
                  ? 'No appointments today.'
                  : scope === 'upcoming'
                    ? 'No upcoming appointments.'
                    : 'No appointments found.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-ink-100 text-xs uppercase tracking-wide text-brand-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Date &amp; time</th>
                  <th className="px-4 py-3 font-medium">Doctor</th>
                  <th className="px-4 py-3 font-medium">Treatment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-ink-50">
                {rows.map((a) => (
                  <tr key={a.id} className="hover:bg-brand-ink-50/50">
                    <td className="px-4 py-3">
                      <button
                        className="font-medium text-brand-ink-800 hover:text-brand-green-700"
                        onClick={() => navigate(`/patients/${a.patient_id}`)}
                      >
                        {a.patient_name}
                      </button>
                      <div className="text-xs text-brand-ink-400">{a.patient_phone}</div>
                    </td>
                    <td className="px-4 py-3 text-brand-ink-600">
                      {formatDate(a.scheduled_at)}
                      <span className="block text-xs text-brand-ink-400">
                        {formatTime(a.scheduled_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-brand-ink-600">{a.doctor_name ?? '—'}</td>
                    <td className="px-4 py-3 text-brand-ink-600">{a.treatment ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_META[a.status].tone}>{STATUS_META[a.status].label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <AppointmentActions
                        appointment={a}
                        onEdit={(appt) => {
                          setEditing(appt);
                          setFormOpen(true);
                        }}
                        onStatus={handleStatus}
                        onComplete={(appt) => setCompleteFor(appt)}
                        onNoShow={handleNoShow}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && total > PAGE_SIZE && (
          <div className="border-t border-brand-ink-100 px-2">
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>

      <AppointmentForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => void load()}
        appointment={editing}
      />

      <CompleteAppointmentModal
        open={Boolean(completeFor)}
        appointment={completeFor}
        onClose={() => setCompleteFor(null)}
        onCompleted={() => void load()}
      />
    </div>
  );
}
