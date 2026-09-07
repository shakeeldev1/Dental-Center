import { useCallback, useEffect, useState } from 'react';
import { CalendarPlus, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatTime } from '@/lib/format';
import { listPatientAppointments, setAppointmentStatus, markAppointmentNoShow } from './api';
import { STATUS_META } from './status';
import { AppointmentForm } from './AppointmentForm';
import { AppointmentActions } from './AppointmentActions';
import { CompleteAppointmentModal } from './CompleteAppointmentModal';
import type { AppointmentDetails, AppointmentStatus } from './types';
import type { PickedPatient } from './PatientPicker';

export function PatientAppointmentsSection({
  patient,
  onChanged,
}: {
  patient: PickedPatient;
  onChanged?: () => void;
}) {
  const toast = useToast();
  const [rows, setRows] = useState<AppointmentDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AppointmentDetails | null>(null);
  const [completeFor, setCompleteFor] = useState<AppointmentDetails | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await listPatientAppointments(patient.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load appointments.');
    } finally {
      setLoading(false);
    }
  }, [patient.id, toast]);

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
      onChanged?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not mark no show.');
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-brand-ink-700">Appointment history</h2>
        <Button
          variant="secondary"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <CalendarPlus className="h-4 w-4" /> New appointment
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No appointments yet." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand-ink-100 text-xs uppercase tracking-wide text-brand-ink-400">
              <tr>
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

      <AppointmentForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => void load()}
        appointment={editing}
        lockedPatient={editing ? null : patient}
      />

      <CompleteAppointmentModal
        open={Boolean(completeFor)}
        appointment={completeFor}
        onClose={() => setCompleteFor(null)}
        onCompleted={() => {
          void load();
          onChanged?.();
        }}
      />
    </section>
  );
}
