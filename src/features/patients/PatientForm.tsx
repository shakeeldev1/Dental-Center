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
import { createFamily } from '@/features/families/api';
import { createPatient, updatePatient, checkExistingPatientByPhone } from './api';
import { ExistingCustomerBanner } from './ExistingCustomerBanner';
import { LEAD_SOURCE_LABEL, GENDER_LABEL } from './labels';
import type { CustomerType, Gender, LeadSource, Patient, PatientInput, PatientOverview } from './types';
import type { LanguageCode } from '@/types';

interface PatientFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: (patient: Patient) => void;
  patient?: Patient | null; // present = edit mode
  /** Fired after a new Family Profile + primary contact is created. */
  onFamilyCreated?: (familyId: string) => void;
}

interface FormState {
  full_name: string;
  phone: string;
  email: string;
  date_of_birth: string;
  preferred_language: LanguageCode;
  notes: string;
  gender: Gender | '';
  customer_type: CustomerType;
  lead_source: LeadSource | '';
  preferred_doctor_id: string;
  preferred_service_id: string;
  family_name: string;
}

const EMPTY: FormState = {
  full_name: '',
  phone: '',
  email: '',
  date_of_birth: '',
  preferred_language: 'en',
  notes: '',
  gender: '',
  customer_type: 'individual',
  lead_source: '',
  preferred_doctor_id: '',
  preferred_service_id: '',
  family_name: '',
};

export function PatientForm({ open, onClose, onSaved, patient, onFamilyCreated }: PatientFormProps) {
  const toast = useToast();
  const isEdit = Boolean(patient);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [existing, setExisting] = useState<PatientOverview | null>(null);
  const [checkingPhone, setCheckingPhone] = useState(false);

  useEffect(() => {
    if (!open) return;
    listActiveDoctors().then(setDoctors).catch(() => setDoctors([]));
    listActiveServices().then(setServices).catch(() => setServices([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setExisting(null);
    setForm(
      patient
        ? {
            full_name: patient.full_name,
            phone: patient.phone,
            email: patient.email ?? '',
            date_of_birth: patient.date_of_birth ?? '',
            preferred_language: patient.preferred_language,
            notes: patient.notes ?? '',
            gender: patient.gender ?? '',
            customer_type: patient.customer_type,
            lead_source: patient.lead_source ?? '',
            preferred_doctor_id: patient.preferred_doctor_id ?? '',
            preferred_service_id: patient.preferred_service_id ?? '',
            family_name: '',
          }
        : EMPTY,
    );
  }, [open, patient]);

  // Duplicate-detection pre-check: mobile number is the primary identifier (spec §14).
  useEffect(() => {
    if (isEdit || !open) return;
    const normalized = normalizePhone(form.phone);
    if (!normalized) {
      setExisting(null);
      return;
    }
    const t = setTimeout(async () => {
      setCheckingPhone(true);
      try {
        setExisting(await checkExistingPatientByPhone(normalized));
      } catch {
        setExisting(null);
      } finally {
        setCheckingPhone(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [form.phone, isEdit, open]);

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

    if (form.customer_type === 'family' && !isEdit && !form.family_name.trim()) {
      next.family_name = 'Family name is required.';
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
      preferred_language: form.preferred_language,
      notes: form.notes.trim() || null,
      customer_type: form.customer_type,
      gender: form.gender || null,
      lead_source: form.lead_source || null,
      preferred_doctor_id: form.preferred_doctor_id || null,
      preferred_service_id: form.preferred_service_id || null,
    };

    setSaving(true);
    try {
      if (isEdit) {
        const saved = await updatePatient(patient!.id, payload);
        toast.success('Patient updated.');
        onSaved(saved);
        onClose();
      } else if (form.customer_type === 'family') {
        const { family, primaryContact } = await createFamily(
          form.family_name.trim(),
          payload,
          null,
        );
        toast.success('Family profile created.');
        onSaved(primaryContact);
        onFamilyCreated?.(family.id);
        onClose();
      } else {
        const saved = await createPatient(payload);
        toast.success('Patient added.');
        onSaved(saved);
        onClose();
      }
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
      title={isEdit ? 'Edit patient' : 'New customer'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving} disabled={Boolean(existing)}>
            {isEdit ? 'Save changes' : 'Add customer'}
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
          label="Mobile number"
          htmlFor="phone"
          required
          error={errors.phone}
          hint={checkingPhone ? 'Checking…' : 'Qatar local numbers are auto-prefixed with +974.'}
        >
          <input
            id="phone"
            className="input"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="5XXXXXXX or +9745XXXXXXX"
          />
        </Field>

        {existing && !isEdit && <ExistingCustomerBanner patient={existing} />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" error={errors.email} hint="Optional">
            <input
              id="email"
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </Field>

          <Field label="Date of birth" htmlFor="dob" hint="Optional">
            <input
              id="dob"
              type="date"
              className="input"
              value={form.date_of_birth}
              onChange={(e) => set('date_of_birth', e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Gender" htmlFor="gender">
            <select
              id="gender"
              className="input"
              value={form.gender}
              onChange={(e) => set('gender', e.target.value as Gender | '')}
            >
              <option value="">Not specified</option>
              {(Object.keys(GENDER_LABEL) as Gender[]).map((g) => (
                <option key={g} value={g}>
                  {GENDER_LABEL[g]}
                </option>
              ))}
            </select>
          </Field>

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
        </div>

        <Field label="Lead source" htmlFor="lead_source">
          <select
            id="lead_source"
            className="input"
            value={form.lead_source}
            onChange={(e) => set('lead_source', e.target.value as LeadSource | '')}
          >
            <option value="">Not specified</option>
            {(Object.keys(LEAD_SOURCE_LABEL) as LeadSource[]).map((s) => (
              <option key={s} value={s}>
                {LEAD_SOURCE_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Preferred doctor" htmlFor="preferred_doctor" hint="Optional">
            <select
              id="preferred_doctor"
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

          <Field label="Preferred service" htmlFor="preferred_service" hint="Optional">
            <select
              id="preferred_service"
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

        {!isEdit && (
          <Field label="Customer type" htmlFor="customer_type">
            <select
              id="customer_type"
              className="input"
              value={form.customer_type}
              onChange={(e) => set('customer_type', e.target.value as CustomerType)}
            >
              <option value="individual">Individual</option>
              <option value="family">Family</option>
            </select>
          </Field>
        )}

        {!isEdit && form.customer_type === 'family' && (
          <Field
            label="Family name"
            htmlFor="family_name"
            required
            error={errors.family_name}
            hint='e.g. "Ahmed Family" — you can add more family members afterwards.'
          >
            <input
              id="family_name"
              className="input"
              value={form.family_name}
              onChange={(e) => set('family_name', e.target.value)}
              placeholder={form.full_name ? `${form.full_name} Family` : 'e.g. Ahmed Family'}
            />
          </Field>
        )}

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
