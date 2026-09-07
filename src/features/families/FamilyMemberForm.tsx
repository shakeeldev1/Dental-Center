import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { normalizePhone } from '@/lib/phone';
import { listActiveDoctors } from '@/features/doctors/api';
import type { Doctor } from '@/features/doctors/types';
import { listActiveServices } from '@/features/services/api';
import type { Service } from '@/features/services/types';
import { checkExistingPatientByPhone } from '@/features/patients/api';
import { ExistingCustomerBanner } from '@/features/patients/ExistingCustomerBanner';
import type { Patient, PatientInput, PatientOverview } from '@/features/patients/types';
import { addFamilyMember } from './api';

interface Props {
  open: boolean;
  onClose: () => void;
  familyId: string;
  onAdded: (member: Patient) => void;
}

interface FormState {
  full_name: string;
  phone: string;
  email: string;
  date_of_birth: string;
  relationship: string;
  preferred_doctor_id: string;
  preferred_service_id: string;
  notes: string;
}

const EMPTY: FormState = {
  full_name: '',
  phone: '',
  email: '',
  date_of_birth: '',
  relationship: '',
  preferred_doctor_id: '',
  preferred_service_id: '',
  notes: '',
};

export function FamilyMemberForm({ open, onClose, familyId, onAdded }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [existing, setExisting] = useState<PatientOverview | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setErrors({});
    setExisting(null);
    listActiveDoctors().then(setDoctors).catch(() => setDoctors([]));
    listActiveServices().then(setServices).catch(() => setServices([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const normalized = normalizePhone(form.phone);
    if (!normalized) {
      setExisting(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setExisting(await checkExistingPatientByPhone(normalized));
      } catch {
        setExisting(null);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [form.phone, open]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): { ok: boolean; normalizedPhone?: string } {
    const next: Record<string, string> = {};
    if (!form.full_name.trim()) next.full_name = 'Full name is required.';
    let normalizedPhone: string | undefined;
    if (!form.phone.trim()) {
      next.phone = 'Phone is required.';
    } else {
      const n = normalizePhone(form.phone);
      if (!n) next.phone = 'Enter a valid phone (e.g. 5XXXXXXX or +9745XXXXXXX).';
      else normalizedPhone = n;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    setErrors(next);
    return { ok: Object.keys(next).length === 0, normalizedPhone };
  }

  async function handleSubmit() {
    const { ok, normalizedPhone } = validate();
    if (!ok || !normalizedPhone || existing) return;

    const payload: PatientInput = {
      full_name: form.full_name.trim(),
      phone: normalizedPhone,
      email: form.email.trim() || null,
      date_of_birth: form.date_of_birth || null,
      preferred_language: 'en',
      notes: form.notes.trim() || null,
      customer_type: 'family',
      gender: null,
      lead_source: null,
      preferred_doctor_id: form.preferred_doctor_id || null,
      preferred_service_id: form.preferred_service_id || null,
      relationship: form.relationship.trim() || null,
    };

    setSaving(true);
    try {
      const member = await addFamilyMember(familyId, payload);
      toast.success('Family member added.');
      onAdded(member);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add family member.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add family member"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving} disabled={Boolean(existing)}>
            Add family member
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Full name" htmlFor="fm_full_name" required error={errors.full_name}>
          <input
            id="fm_full_name"
            className="input"
            value={form.full_name}
            onChange={(e) => set('full_name', e.target.value)}
          />
        </Field>

        <Field label="Mobile number" htmlFor="fm_phone" required error={errors.phone}>
          <input
            id="fm_phone"
            className="input"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="5XXXXXXX or +9745XXXXXXX"
          />
        </Field>

        {existing && <ExistingCustomerBanner patient={existing} />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="fm_email" error={errors.email} hint="Optional">
            <input
              id="fm_email"
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </Field>
          <Field label="Date of birth" htmlFor="fm_dob" hint="Optional">
            <input
              id="fm_dob"
              type="date"
              className="input"
              value={form.date_of_birth}
              onChange={(e) => set('date_of_birth', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Relationship" htmlFor="fm_relationship" hint="e.g. Spouse, Son, Daughter">
          <input
            id="fm_relationship"
            className="input"
            value={form.relationship}
            onChange={(e) => set('relationship', e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Doctor" htmlFor="fm_doctor" hint="Optional">
            <select
              id="fm_doctor"
              className="input"
              value={form.preferred_doctor_id}
              onChange={(e) => set('preferred_doctor_id', e.target.value)}
            >
              <option value="">Not specified</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Service" htmlFor="fm_service" hint="Optional">
            <select
              id="fm_service"
              className="input"
              value={form.preferred_service_id}
              onChange={(e) => set('preferred_service_id', e.target.value)}
            >
              <option value="">Not specified</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Notes" htmlFor="fm_notes">
          <textarea
            id="fm_notes"
            className="input min-h-[70px] resize-y"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
