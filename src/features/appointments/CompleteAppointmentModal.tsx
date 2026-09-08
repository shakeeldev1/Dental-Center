import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { listActiveServices } from '@/features/services/api';
import type { Service } from '@/features/services/types';
import { createFutureTreatment } from '@/features/treatments/api';
import { TREATMENT_STATUS_META, TREATMENT_STATUSES } from '@/features/treatments/labels';
import type { TreatmentStatus } from '@/features/treatments/types';
import { completeAppointment, type CompletePayload } from './api';
import type { AppointmentDetails } from './types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCompleted: () => void;
  appointment: AppointmentDetails | null;
}

type Step = 'complete' | 'future-decision' | 'future-form';

export function CompleteAppointmentModal({ open, onClose, onCompleted, appointment }: Props) {
  const toast = useToast();
  const [step, setStep] = useState<Step>('complete');
  const [treatment, setTreatment] = useState('');
  const [doctor, setDoctor] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Future treatment fields.
  const [services, setServices] = useState<Service[]>([]);
  const [futureServiceId, setFutureServiceId] = useState('');
  const [futureTreatmentName, setFutureTreatmentName] = useState('');
  const [futureDate, setFutureDate] = useState('');
  const [futureStatus, setFutureStatus] = useState<TreatmentStatus>('planned');
  const [futureNotes, setFutureNotes] = useState('');
  const [futureErrors, setFutureErrors] = useState<Record<string, string>>({});
  const [savingFuture, setSavingFuture] = useState(false);

  useEffect(() => {
    if (!open || !appointment) return;
    setStep('complete');
    setTreatment(appointment.treatment ?? '');
    setDoctor(appointment.doctor_name ?? '');
    setNotes('');
    setFutureServiceId('');
    setFutureTreatmentName('');
    setFutureDate('');
    setFutureStatus('planned');
    setFutureNotes('');
    setFutureErrors({});
    listActiveServices().then(setServices).catch(() => setServices([]));
  }, [open, appointment]);

  async function handleSubmit() {
    if (!appointment) return;
    const payload: CompletePayload = {
      treatment: treatment.trim() || undefined,
      doctor_name: doctor.trim() || undefined,
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
      setStep('future-decision');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not complete appointment.');
    } finally {
      setSaving(false);
    }
  }

  function finishWithoutFutureTreatment() {
    setStep('complete');
    onClose();
  }

  async function handleSaveFutureTreatment() {
    if (!appointment) return;
    const next: Record<string, string> = {};
    const name = futureServiceId ? (services.find((s) => s.id === futureServiceId)?.name ?? '') : futureTreatmentName.trim();
    if (!name) next.treatment = 'Select a service or enter a treatment name.';
    if (!futureDate) next.date = 'Expected date is required.';
    setFutureErrors(next);
    if (Object.keys(next).length > 0) return;

    setSavingFuture(true);
    try {
      await createFutureTreatment({
        patient_id: appointment.patient_id,
        treatment: name,
        notes: futureNotes.trim() || null,
        treatment_date: futureDate,
        status: futureStatus,
      });
      toast.success('Future treatment added.');
      onCompleted();
      setStep('complete');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add future treatment.');
    } finally {
      setSavingFuture(false);
    }
  }

  const title =
    step === 'complete'
      ? 'Complete appointment'
      : step === 'future-decision'
        ? 'Add future treatment?'
        : 'Add future treatment';

  const footer =
    step === 'complete' ? (
      <>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={saving}>
          Complete &amp; send review
        </Button>
      </>
    ) : step === 'future-decision' ? (
      <>
        <Button variant="secondary" onClick={finishWithoutFutureTreatment}>
          No Future Treatment
        </Button>
        <Button onClick={() => setStep('future-form')}>Add Future Treatment</Button>
      </>
    ) : (
      <>
        <Button variant="secondary" onClick={() => setStep('future-decision')} disabled={savingFuture}>
          Back
        </Button>
        <Button onClick={() => void handleSaveFutureTreatment()} loading={savingFuture}>
          Save future treatment
        </Button>
      </>
    );

  return (
    <Modal open={open} onClose={onClose} title={title} footer={footer}>
      {step === 'complete' && (
        <div className="space-y-4">
          {appointment && (
            <p className="text-sm text-brand-ink-500">
              Completing <span className="font-medium text-brand-ink-800">{appointment.patient_name}</span>
              &apos;s appointment. This records treatment history and sends a review request.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          <Field label="Notes" htmlFor="c_notes">
            <textarea
              id="c_notes"
              className="input min-h-[70px] resize-y"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>
      )}

      {step === 'future-decision' && appointment && (
        <div className="space-y-2 text-sm text-brand-ink-600">
          <p>
            Appointment completed for{' '}
            <span className="font-medium text-brand-ink-800">{appointment.patient_name}</span>. Would you
            like to schedule a future treatment for this patient now?
          </p>
        </div>
      )}

      {step === 'future-form' && (
        <div className="space-y-4">
          <Field label="Treatment / Service" htmlFor="ft_service" required error={futureErrors.treatment}>
            <select
              id="ft_service"
              className="input"
              value={futureServiceId}
              onChange={(e) => setFutureServiceId(e.target.value)}
            >
              <option value="">Other (type below)…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          {!futureServiceId && (
            <Field label="Treatment name" htmlFor="ft_name">
              <input
                id="ft_name"
                className="input"
                value={futureTreatmentName}
                onChange={(e) => setFutureTreatmentName(e.target.value)}
                placeholder="e.g. Follow-up cleaning"
              />
            </Field>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Expected date" htmlFor="ft_date" required error={futureErrors.date}>
              <input
                id="ft_date"
                type="date"
                className="input"
                value={futureDate}
                onChange={(e) => setFutureDate(e.target.value)}
              />
            </Field>
            <Field label="Status" htmlFor="ft_status">
              <select
                id="ft_status"
                className="input"
                value={futureStatus}
                onChange={(e) => setFutureStatus(e.target.value as TreatmentStatus)}
              >
                {TREATMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {TREATMENT_STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Notes" htmlFor="ft_notes">
            <textarea
              id="ft_notes"
              className="input min-h-[70px] resize-y"
              value={futureNotes}
              onChange={(e) => setFutureNotes(e.target.value)}
            />
          </Field>
        </div>
      )}
    </Modal>
  );
}
