import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, Eye, Pencil, Users, CalendarPlus, Upload, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/format';
import { listPatients } from './api';
import { PatientForm } from './PatientForm';
import { ImportPatientsModal } from './ImportPatientsModal';
import { AppointmentForm } from '@/features/appointments/AppointmentForm';
import { SegmentFilterBuilder } from '@/features/campaigns/SegmentFilterBuilder';
import { isEmptySegmentFilters, listPatientsBySegment, type SegmentFilters, type SegmentRow } from './segment';
import { CUSTOMER_STATUS_LABEL, CUSTOMER_STATUS_TONE, LEAD_SOURCE_LABEL } from './labels';
import type { PickedPatient } from '@/features/appointments/PatientPicker';
import { useAuth } from '@/context/AuthContext';
import type { Patient, PatientOverview } from './types';

const PAGE_SIZE = 10;

export function PatientsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [rows, setRows] = useState<PatientOverview[]>([]);
  const [segmentRows, setSegmentRows] = useState<SegmentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SegmentFilters>({});
  const filtering = !isEmptySegmentFilters(filters);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [apptFor, setApptFor] = useState<PickedPatient | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // Debounce the search box.
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
      if (filtering) {
        const { rows: segRows, total } = await listPatientsBySegment(filters, { page, pageSize: PAGE_SIZE });
        setSegmentRows(segRows);
        setTotal(total);
      } else {
        const { rows, total } = await listPatients({ search: debounced, page, pageSize: PAGE_SIZE });
        setRows(rows);
        setTotal(total);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load patients.');
    } finally {
      setLoading(false);
    }
  }, [debounced, page, toast, filtering, filters]);

  useEffect(() => {
    void load();
  }, [load]);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(p: PatientOverview) {
    setEditing(p);
    setFormOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink-800">Patients</h1>
          <p className="text-sm text-brand-ink-400">{total} total</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
          )}
          <Button onClick={openNew}>
            <UserPlus className="h-4 w-4" />
            New patient
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-brand-ink-400" />
          <input
            className="input pl-9"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={filtering}
          />
        </div>
        <Button variant="secondary" onClick={() => setFiltersOpen((o) => !o)}>
          <Filter className="h-4 w-4" /> Filters {filtering ? '(active)' : ''}
        </Button>
        {filtering && (
          <Button
            variant="ghost"
            onClick={() => {
              setFilters({});
              setPage(1);
            }}
          >
            <X className="h-4 w-4" /> Clear filters
          </Button>
        )}
      </div>

      {filtersOpen && (
        <SegmentFilterBuilder
          value={filters}
          onChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
        />
      )}

      {filtering ? (
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner className="h-7 w-7" />
            </div>
          ) : segmentRows.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Users} title="No customers match these filters." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-brand-ink-100 text-xs uppercase tracking-wide text-brand-ink-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Lead source</th>
                    <th className="px-4 py-3 font-medium">Doctor / Service</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-ink-50">
                  {segmentRows.map((p) => (
                    <tr key={p.id} className="hover:bg-brand-ink-50/50">
                      <td className="px-4 py-3">
                        <button
                          className="font-medium text-brand-ink-800 hover:text-brand-green-700"
                          onClick={() => navigate(`/patients/${p.id}`)}
                        >
                          {p.full_name}
                        </button>
                        {p.family_name && (
                          <div className="text-xs text-brand-ink-400">{p.family_name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-brand-ink-600">{p.phone}</td>
                      <td className="px-4 py-3 text-brand-ink-600">
                        {p.lead_source ? LEAD_SOURCE_LABEL[p.lead_source] : '—'}
                      </td>
                      <td className="px-4 py-3 text-brand-ink-600">
                        {p.preferred_doctor_name ?? '—'}
                        {p.preferred_service_name ? ` · ${p.preferred_service_name}` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={CUSTOMER_STATUS_TONE[p.customer_status]}>
                          {CUSTOMER_STATUS_LABEL[p.customer_status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            className="btn-ghost p-1.5"
                            title="View profile"
                            onClick={() => navigate(`/patients/${p.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
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
      ) : (
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-7 w-7" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Users}
              title={debounced ? 'No patients match your search.' : 'No patients yet.'}
              description={debounced ? undefined : 'Add your first patient to get started.'}
              action={
                !debounced ? (
                  <Button onClick={openNew}>
                    <UserPlus className="h-4 w-4" />
                    New patient
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-ink-100 text-xs uppercase tracking-wide text-brand-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Last visit</th>
                  <th className="px-4 py-3 font-medium">Next treatment</th>
                  <th className="px-4 py-3 font-medium">Visits</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-ink-50">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-ink-50/50">
                    <td className="px-4 py-3">
                      <button
                        className="font-medium text-brand-ink-800 hover:text-brand-green-700"
                        onClick={() => navigate(`/patients/${p.id}`)}
                      >
                        {p.full_name}
                      </button>
                      <div className="mt-0.5">
                        <Badge tone={p.preferred_language === 'ar' ? 'amber' : 'gray'}>
                          {p.preferred_language === 'ar' ? 'Arabic' : 'English'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-brand-ink-600">{p.phone}</td>
                    <td className="px-4 py-3 text-brand-ink-600">{formatDate(p.last_visit)}</td>
                    <td className="px-4 py-3 text-brand-ink-600">
                      {p.next_treatment ? (
                        <span>
                          {p.next_treatment}
                          {p.next_treatment_date && (
                            <span className="block text-xs text-brand-ink-400">
                              {formatDate(p.next_treatment_date)}
                            </span>
                          )}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-brand-ink-600">{p.visits_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          className="btn-ghost p-1.5"
                          title="View profile"
                          onClick={() => navigate(`/patients/${p.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="btn-ghost p-1.5"
                          title="New appointment"
                          onClick={() =>
                            setApptFor({ id: p.id, full_name: p.full_name, phone: p.phone })
                          }
                        >
                          <CalendarPlus className="h-4 w-4" />
                        </button>
                        <button
                          className="btn-ghost p-1.5"
                          title="Edit"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
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
      )}

      <PatientForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => void load()}
        patient={editing}
      />

      <AppointmentForm
        open={Boolean(apptFor)}
        onClose={() => setApptFor(null)}
        onSaved={() => void load()}
        lockedPatient={apptFor}
      />

      <ImportPatientsModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => void load()}
      />
    </div>
  );
}
