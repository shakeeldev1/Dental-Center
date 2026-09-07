import { useCallback, useEffect, useState } from 'react';
import { ListChecks, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/format';
import { listStaffDirectory, type StaffDirectoryEntry } from '@/features/users/api';
import { listPatientFollowUps, setFollowUpStatus } from './api';
import { AddFollowUpModal } from './AddFollowUpModal';
import { PRIORITY_META, STATUS_META } from './labels';
import type { FollowUp, FollowUpStatus } from './types';

export function FollowUpsSection({
  patientId,
  addOpen,
  onAddOpenChange,
}: {
  patientId: string;
  addOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
}) {
  const toast = useToast();
  const [rows, setRows] = useState<FollowUp[]>([]);
  const [staff, setStaff] = useState<StaffDirectoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listPatientFollowUps(patientId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load follow-ups.');
    } finally {
      setLoading(false);
    }
  }, [patientId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    listStaffDirectory().then(setStaff).catch(() => setStaff([]));
  }, []);

  function assigneeName(id: string | null): string {
    if (!id) return 'Reception';
    return staff.find((s) => s.id === id)?.full_name ?? 'Reception';
  }

  async function updateStatus(id: string, status: FollowUpStatus) {
    try {
      await setFollowUpStatus(id, status);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update follow-up.');
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-brand-ink-700">Follow-ups</h2>
        <Button variant="secondary" onClick={() => onAddOpenChange(true)}>
          <Plus className="h-4 w-4" /> Add follow-up
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={ListChecks} title="No follow-ups yet." />
      ) : (
        <div className="card divide-y divide-brand-ink-50">
          {rows.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-brand-ink-800">{f.task}</p>
                <p className="text-xs text-brand-ink-400">
                  Due {formatDate(f.due_date)} · <Badge tone={PRIORITY_META[f.priority].tone}>{PRIORITY_META[f.priority].label}</Badge>{' '}
                  · Assigned to {assigneeName(f.assigned_to)}
                </p>
              </div>
              <select
                className="input w-auto py-1"
                value={f.status}
                onChange={(e) => void updateStatus(f.id, e.target.value as FollowUpStatus)}
              >
                {(Object.keys(STATUS_META) as FollowUpStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      <AddFollowUpModal
        open={addOpen}
        onClose={() => onAddOpenChange(false)}
        patientId={patientId}
        onAdded={() => void load()}
      />
    </section>
  );
}
