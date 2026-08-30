import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { normalizePhone } from '@/lib/phone';
import { createPatient, updatePatient } from './api';
import type { Patient, PatientInput } from './types';
import type { LanguageCode } from '@/types';

interface PatientFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: (patient: Patient) => void;
  patient?: Patient | null; // present = edit mode
}

interface FormState {
  full_name: string;
  phone: string;
  email: string;
  date_of_birth: string;
  preferred_language: LanguageCode;
  notes: string;
}

const EMPTY: FormState = {
  full_name: '',
  phone: '',
  email: '',
  date_of_birth: '',
  preferred_language: 'en',
  notes: '',
};

export function PatientForm({ open, onClose, onSaved, patient }: PatientFormProps) {
  const toast = useToast();
  const isEdit = Boolean(patient);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      patient
        ? {
            full_name: patient.full_name,
            phone: patient.phone,
            email: patient.email ?? '',
            date_of_birth: patient.date_of_birth ?? '',
            preferred_language: patient.preferred_language,
            notes: patient.notes ?? '',
          }
        : EMPTY,
    );
  }, [open, patient]);

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
    if (!ok || !normalizedPhone) return;

    const payload: PatientInput = {
      full_name: form.full_name.trim(),
      phone: normalizedPhone,
      email: form.email.trim() || null,
      date_of_birth: form.date_of_birth || null,
      preferred_language: form.preferred_language,
      notes: form.notes.trim() || null,
    };

    setSaving(true);
    try {
      const saved = isEdit
        ? await updatePatient(patient!.id, payload)
        : await createPatient(payload);
      toast.success(isEdit ? 'Patient updated.' : 'Patient added.');
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save patient.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit patient' : 'New patient'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            {isEdit ? 'Save changes' : 'Add patient'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Full name" htmlFor="full_name" required error={errors.full_name}>
          <input
            id="full_name"
            className="input"
            value={form.full_name}
            onChange={(e) => set('full_name', e.target.value)}
          />
        </Field>

        <Field
          label="WhatsApp / Phone"
          htmlFor="phone"
          required
          error={errors.phone}
          hint="Qatar local numbers are auto-prefixed with +974."
        >
          <input
            id="phone"
            className="input"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="5XXXXXXX or +9745XXXXXXX"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Email" htmlFor="email" error={errors.email}>
            <input
              id="email"
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </Field>

          <Field label="Date of birth" htmlFor="dob">
            <input
              id="dob"
              type="date"
              className="input"
              value={form.date_of_birth}
              onChange={(e) => set('date_of_birth', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Preferred language" htmlFor="lang">
          <select
            id="lang"
            className="input"
            value={form.preferred_language}
            onChange={(e) => set('preferred_language', e.target.value as LanguageCode)}
          >
            <option value="en">English</option>
            <option value="ar">Arabic</option>
          </select>
        </Field>

        <Field label="Notes" htmlFor="notes">
          <textarea
            id="notes"
            className="input min-h-[80px] resize-y"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
