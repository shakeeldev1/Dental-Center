import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { toClinicISO, fromClinicISO, clinicToday } from '@/lib/clinic';
import { listActiveDoctors } from '@/features/doctors/api';
import type { Doctor } from '@/features/doctors/types';
import { listActiveServices } from '@/features/services/api';
import type { Service } from '@/features/services/types';
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
  const [endTime, setEndTime] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [notes, setNotes] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    listActiveDoctors()
      .then((active) => {
        // Keep a since-deactivated doctor selectable when editing an appointment that still references it.
        if (appointment?.doctor_id && !active.some((d) => d.id === appointment.doctor_id)) {
          active = [
            ...active,
            {
              id: appointment.doctor_id,
              full_name: appointment.doctor_name ?? 'Unknown doctor',
              specialty: null,
              is_active: false,
              created_at: '',
              updated_at: '',
            },
          ];
        }
        setDoctors(active);
      })
      .catch(() => setDoctors([]));
    listActiveServices()
      .then((active) => {
        if (appointment?.service_id && !active.some((s) => s.id === appointment.service_id)) {
          active = [
            ...active,
            {
              id: appointment.service_id,
              name: appointment.treatment ?? 'Unknown service',
              category: null,
              is_active: false,
              duration_minutes: null,
              price: null,
              created_at: '',
              updated_at: '',
            },
          ];
        }
        setServices(active);
      })
      .catch(() => setServices([]));
  }, [open, appointment]);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (appointment) {
      const { date, time } = fromClinicISO(appointment.scheduled_at);
      const end = appointment.ends_at ? fromClinicISO(appointment.ends_at).time : '';
      setPatient({
        id: appointment.patient_id,
        full_name: appointment.patient_name,
        phone: appointment.patient_phone,
      });
      setDate(date);
      setTime(time);
      setEndTime(end);
      setDoctorId(appointment.doctor_id ?? '');
      setServiceId(appointment.service_id ?? '');
      setNotes(appointment.notes ?? '');
    } else {
      setPatient(lockedPatient ?? null);
      setDate(clinicToday());
      setTime('09:00');
      setEndTime('09:30');
      setDoctorId('');
      setServiceId('');
      setNotes('');
    }
  }, [open, appointment, lockedPatient]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!patient) next.patient = 'Select a patient.';
    if (!date) next.date = 'Date is required.';
    if (!time) next.time = 'Start time is required.';
    if (!endTime) next.endTime = 'End time is required.';
    if (time && endTime && endTime <= time) next.endTime = 'End time must be after start time.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || !patient) return;
    const doctor = doctors.find((d) => d.id === doctorId) ?? null;
    const service = services.find((s) => s.id === serviceId) ?? null;
    const payload: AppointmentInput = {
      patient_id: patient.id,
      scheduled_at: toClinicISO(date, time),
      ends_at: toClinicISO(date, endTime),
      doctor_id: doctorId || null,
      service_id: serviceId || null,
      // Denormalized text kept for WhatsApp templates ({{doctor_name}}, {{treatment}}).
      doctor_name: doctor?.full_name ?? null,
      treatment: service?.name ?? null,
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

        <div className="grid grid-cols-3 gap-4">
          <Field label="Date" htmlFor="date" required error={errors.date}>
            <input
              id="date"
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Start time" htmlFor="time" required error={errors.time}>
            <input
              id="time"
              type="time"
              className="input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>
          <Field label="End time" htmlFor="endTime" required error={errors.endTime}>
            <input
              id="endTime"
              type="time"
              className="input"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Doctor" htmlFor="doctor">
            <select
              id="doctor"
              className="input"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              <option value="">Select doctor…</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name}
                  {d.specialty ? ` (${d.specialty})` : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Service" htmlFor="service">
            <select
              id="service"
              className="input"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            >
              <option value="">Select service…</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

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
