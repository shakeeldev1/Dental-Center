import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle, ArrowDownLeft } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime } from '@/lib/format';
import { listMessages } from './api';
import { TYPE_LABEL, STATUS_TONE, TYPE_FILTERS, STATUS_FILTERS } from './labels';
import type { WhatsappMessage, WaMessageStatus, WaMessageType } from './types';

const PAGE_SIZE = 20;

export function WhatsappLogsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [rows, setRows] = useState<WhatsappMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState<WaMessageType | 'all'>('all');
  const [status, setStatus] = useState<WaMessageStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(true);

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
      const res = await listMessages({ type, status, search: debounced, page, pageSize: PAGE_SIZE });
      setRows(res.rows);
      setTotal(res.total);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load messages.');
    } finally {
      setLoading(false);
    }
  }, [type, status, debounced, page, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink-800">WhatsApp</h1>
        <p className="text-sm text-brand-ink-400">{total} messages</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          className="input w-auto"
          value={type}
          onChange={(e) => {
            setType(e.target.value as WaMessageType | 'all');
            setPage(1);
          }}
        >
          {TYPE_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as WaMessageStatus | 'all');
            setPage(1);
          }}
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-brand-ink-400" />
          <input
            className="input pl-9"
            placeholder="Search patient or phone…"
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
            <EmptyState icon={MessageCircle} title="No messages found." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-ink-100 text-xs uppercase tracking-wide text-brand-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
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
                    <td className="px-4 py-3">
                      {m.patient_id ? (
                        <button
                          className="font-medium text-brand-ink-800 hover:text-brand-green-700"
                          onClick={() => navigate(`/patients/${m.patient_id}`)}
                        >
                          {m.patient_name ?? 'Patient'}
                        </button>
                      ) : (
                        <span className="text-brand-ink-400">—</span>
                      )}
                      {m.direction === 'inbound' && (
                        <span className="ml-2 inline-flex items-center gap-0.5 text-xs text-brand-ink-400">
                          <ArrowDownLeft className="h-3 w-3" /> in
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-brand-ink-600">{m.phone}</td>
                    <td className="px-4 py-3 text-brand-ink-600">{TYPE_LABEL[m.message_type]}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[m.status]}>{m.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-brand-ink-500">
                      {m.error_message ? (
                        <span className="text-red-600">{m.error_message}</span>
                      ) : m.provider_message_id ? (
                        <span>ID: {m.provider_message_id}</span>
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

        {!loading && total > PAGE_SIZE && (
          <div className="border-t border-brand-ink-100 px-2">
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
