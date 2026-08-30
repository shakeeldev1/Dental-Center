import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { completeAppointment, type CompletePayload } from './api';
import type { AppointmentDetails } from './types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCompleted: () => void;
  appointment: AppointmentDetails | null;
}

export function CompleteAppointmentModal({ open, onClose, onCompleted, appointment }: Props) {
  const toast = useToast();
  const [treatment, setTreatment] = useState('');
  const [doctor, setDoctor] = useState('');
  const [nextTreatment, setNextTreatment] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !appointment) return;
    setTreatment(appointment.treatment ?? '');
    setDoctor(appointment.doctor_name ?? '');
    setNextTreatment('');
    setNextDate('');
    setNotes('');
  }, [open, appointment]);

  async function handleSubmit() {
    if (!appointment) return;
    const payload: CompletePayload = {
      treatment: treatment.trim() || undefined,
      doctor_name: doctor.trim() || undefined,
      next_treatment: nextTreatment.trim() || undefined,
      next_treatment_date: nextDate || undefined,
      notes: notes.trim() || undefined,
    };
    setSaving(true);
    try {
      const res = await completeAppointment(appointment.id, payload);
      toast.success('Appointment completed.');
      if (res.review.ok) toast.success('Review request sent.');
      else if (!res.review.alreadySent) {
        toast.error(`Review not sent: ${res.review.error ?? 'unknown error'}`);
      }
      onCompleted();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not complete appointment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Complete appointment"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Complete &amp; send review
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {appointment && (
          <p className="text-sm text-brand-ink-500">
            Completing <span className="font-medium text-brand-ink-800">{appointment.patient_name}</span>
            &apos;s appointment. This records treatment history and sends a review request.
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Treatment done" htmlFor="c_treatment">
            <input
              id="c_treatment"
              className="input"
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              placeholder="e.g. Dental cleaning"
            />
          </Field>
          <Field label="Doctor" htmlFor="c_doctor">
            <input
              id="c_doctor"
              className="input"
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Next treatment" htmlFor="c_next" hint="Optional — schedules a reminder.">
            <input
              id="c_next"
              className="input"
              value={nextTreatment}
              onChange={(e) => setNextTreatment(e.target.value)}
              placeholder="e.g. Follow-up cleaning"
            />
          </Field>
          <Field label="Next treatment date" htmlFor="c_nextdate">
            <input
              id="c_nextdate"
              type="date"
              className="input"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Notes" htmlFor="c_notes">
          <textarea
            id="c_notes"
            className="input min-h-[70px] resize-y"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
