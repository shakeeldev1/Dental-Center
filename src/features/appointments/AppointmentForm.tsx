import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { toClinicISO, fromClinicISO, clinicToday } from '@/lib/clinic';
import { PatientPicker, type PickedPatient } from './PatientPicker';
import { createAppointment, updateAppointment, confirmAppointment } from './api';
import type { AppointmentDetails, AppointmentInput } from './types';

interface AppointmentFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Edit mode: existing appointment. */
  appointment?: AppointmentDetails | null;
  /** Prefill + lock the patient (from a patient profile / list). */
  lockedPatient?: PickedPatient | null;
}

export function AppointmentForm({
  open,
  onClose,
  onSaved,
  appointment,
  lockedPatient,
}: AppointmentFormProps) {
  const toast = useToast();
  const isEdit = Boolean(appointment);

  const [patient, setPatient] = useState<PickedPatient | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [doctor, setDoctor] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (appointment) {
      const { date, time } = fromClinicISO(appointment.scheduled_at);
      setPatient({
        id: appointment.patient_id,
        full_name: appointment.patient_name,
        phone: appointment.patient_phone,
      });
      setDate(date);
      setTime(time);
      setDoctor(appointment.doctor_name ?? '');
      setTreatment(appointment.treatment ?? '');
      setNotes(appointment.notes ?? '');
    } else {
      setPatient(lockedPatient ?? null);
      setDate(clinicToday());
      setTime('09:00');
      setDoctor('');
      setTreatment('');
      setNotes('');
    }
  }, [open, appointment, lockedPatient]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!patient) next.patient = 'Select a patient.';
    if (!date) next.date = 'Date is required.';
    if (!time) next.time = 'Time is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || !patient) return;
    const payload: AppointmentInput = {
      patient_id: patient.id,
      scheduled_at: toClinicISO(date, time),
      doctor_name: doctor.trim() || null,
      treatment: treatment.trim() || null,
      notes: notes.trim() || null,
    };
    setSaving(true);
    try {
      if (isEdit) {
        await updateAppointment(appointment!.id, payload);
        toast.success('Appointment updated.');
      } else {
        const saved = await createAppointment(payload);
        toast.success('Appointment created.');
        // Send the WhatsApp confirmation via the backend (non-blocking).
        try {
          const c = await confirmAppointment(saved.id);
          if (c.ok) toast.success('WhatsApp confirmation sent.');
          else toast.error(`Confirmation not sent: ${c.error ?? 'unknown error'}`);
        } catch (e) {
          toast.error(
            `Confirmation request failed: ${e instanceof Error ? e.message : 'backend unreachable'}`,
          );
        }
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save appointment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit appointment' : 'New appointment'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {isEdit ? 'Save changes' : 'Create appointment'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Patient" required error={errors.patient}>
          <PatientPicker
            value={patient}
            onChange={setPatient}
            disabled={Boolean(lockedPatient) || isEdit}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Date" htmlFor="date" required error={errors.date}>
            <input
              id="date"
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Time" htmlFor="time" required error={errors.time}>
            <input
              id="time"
              type="time"
              className="input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Doctor" htmlFor="doctor">
          <input
            id="doctor"
            className="input"
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
            placeholder="e.g. Dr. Sara"
          />
        </Field>

        <Field label="Treatment" htmlFor="treatment">
          <input
            id="treatment"
            className="input"
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            placeholder="e.g. Dental cleaning"
          />
        </Field>

        <Field label="Notes" htmlFor="notes">
          <textarea
            id="notes"
            className="input min-h-[70px] resize-y"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
