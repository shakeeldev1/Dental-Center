import { useEffect, useState } from 'react';
import { listActiveDoctors } from '@/features/doctors/api';
import type { Doctor } from '@/features/doctors/types';
import { listActiveServices } from '@/features/services/api';
import type { Service } from '@/features/services/types';
import { LEAD_SOURCE_LABEL, CUSTOMER_STATUS_LABEL } from '@/features/patients/labels';
import type { CustomerStatus, CustomerType, LeadSource } from '@/features/patients/types';
import { STATUS_META } from '@/features/appointments/status';
import type { AppointmentStatus } from '@/features/appointments/types';
import { Field } from '@/components/ui/Field';
import type { SegmentFilters } from '@/features/patients/segment';

interface Props {
  value: SegmentFilters;
  onChange: (next: SegmentFilters) => void;
}

function toggleInArray<T>(arr: T[] | undefined, item: T): T[] {
  const set = new Set(arr ?? []);
  if (set.has(item)) set.delete(item);
  else set.add(item);
  return Array.from(set);
}

export function SegmentFilterBuilder({ value, onChange }: Props) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    listActiveDoctors().then(setDoctors).catch(() => setDoctors([]));
    listActiveServices().then(setServices).catch(() => setServices([]));
  }, []);

  function patch(next: Partial<SegmentFilters>) {
    onChange({ ...value, ...next });
  }

  return (
    <div className="space-y-4 rounded-lg border border-brand-ink-100 bg-brand-ink-50/40 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Doctor" htmlFor="seg_doctor">
          <select
            id="seg_doctor"
            className="input"
            value={value.doctor_id ?? ''}
            onChange={(e) => patch({ doctor_id: e.target.value || undefined })}
          >
            <option value="">Any doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Service" htmlFor="seg_service">
          <select
            id="seg_service"
            className="input"
            value={value.service_id ?? ''}
            onChange={(e) => patch({ service_id: e.target.value || undefined })}
          >
            <option value="">Any service</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Customer type" htmlFor="seg_customer_type">
        <select
          id="seg_customer_type"
          className="input"
          value={value.customer_type ?? ''}
          onChange={(e) => patch({ customer_type: (e.target.value || undefined) as CustomerType | undefined })}
        >
          <option value="">Individual or family</option>
          <option value="individual">Individual only</option>
          <option value="family">Family only</option>
        </select>
      </Field>

      <div>
        <p className="mb-2 text-sm font-medium text-brand-ink-700">Lead source</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(LEAD_SOURCE_LABEL) as LeadSource[]).map((s) => (
            <label
              key={s}
              className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${
                value.lead_source?.includes(s)
                  ? 'border-brand-green-500 bg-brand-green-50 text-brand-green-700'
                  : 'border-brand-ink-200 text-brand-ink-600'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={value.lead_source?.includes(s) ?? false}
                onChange={() => patch({ lead_source: toggleInArray(value.lead_source, s) })}
              />
              {LEAD_SOURCE_LABEL[s]}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-brand-ink-700">Customer status</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CUSTOMER_STATUS_LABEL) as CustomerStatus[]).map((s) => (
            <label
              key={s}
              className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${
                value.customer_status?.includes(s)
                  ? 'border-brand-green-500 bg-brand-green-50 text-brand-green-700'
                  : 'border-brand-ink-200 text-brand-ink-600'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={value.customer_status?.includes(s) ?? false}
                onChange={() => patch({ customer_status: toggleInArray(value.customer_status, s) })}
              />
              {CUSTOMER_STATUS_LABEL[s]}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-brand-ink-700">Last appointment status</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STATUS_META) as AppointmentStatus[]).map((s) => (
            <label
              key={s}
              className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${
                value.last_appointment_status?.includes(s)
                  ? 'border-brand-green-500 bg-brand-green-50 text-brand-green-700'
                  : 'border-brand-ink-200 text-brand-ink-600'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={value.last_appointment_status?.includes(s) ?? false}
                onChange={() =>
                  patch({ last_appointment_status: toggleInArray(value.last_appointment_status, s) })
                }
              />
              {STATUS_META[s].label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {(
          [
            ['has_no_show', 'Has a no-show'],
            ['has_completed', 'Has a completed service'],
            ['review_requested', 'Review requested'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm text-brand-ink-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-brand-ink-300 text-brand-green-600"
              checked={value[key] ?? false}
              onChange={(e) => patch({ [key]: e.target.checked || undefined })}
            />
            {label}
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Created after" htmlFor="seg_created_after">
          <input
            id="seg_created_after"
            type="date"
            className="input"
            value={value.created_after ?? ''}
            onChange={(e) => patch({ created_after: e.target.value || undefined })}
          />
        </Field>
        <Field label="Created before" htmlFor="seg_created_before">
          <input
            id="seg_created_before"
            type="date"
            className="input"
            value={value.created_before ?? ''}
            onChange={(e) => patch({ created_before: e.target.value || undefined })}
          />
        </Field>
        <Field label="Last contact after" htmlFor="seg_contact_after">
          <input
            id="seg_contact_after"
            type="date"
            className="input"
            value={value.last_contact_after ?? ''}
            onChange={(e) => patch({ last_contact_after: e.target.value || undefined })}
          />
        </Field>
        <Field label="Last contact before" htmlFor="seg_contact_before">
          <input
            id="seg_contact_before"
            type="date"
            className="input"
            value={value.last_contact_before ?? ''}
            onChange={(e) => patch({ last_contact_before: e.target.value || undefined })}
          />
        </Field>
      </div>
    </div>
  );
}
