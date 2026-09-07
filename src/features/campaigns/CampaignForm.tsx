import { useEffect, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { audienceCount, createCampaign } from './api';
import { AUDIENCE_LABEL, type AudienceType } from './types';
import { parseCsv, classifyContactRows, type ContactsPreview } from './contacts';
import { SegmentFilterBuilder } from './SegmentFilterBuilder';
import { isEmptySegmentFilters, type SegmentFilters } from '@/features/patients/segment';

const DEFAULT_MESSAGE =
  'Hello {{patient_name}},\n\nWe have a special offer for you:\n\n{{offer}}\n\nContact us to book your appointment.';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CampaignForm({ open, onClose, onCreated }: Props) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [offer, setOffer] = useState('');
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [audience, setAudience] = useState<AudienceType>('all');
  const [segmentFilters, setSegmentFilters] = useState<SegmentFilters>({});
  const [count, setCount] = useState<number | null>(null);
  const [contactsPreview, setContactsPreview] = useState<ContactsPreview | null>(null);
  const [parsingCsv, setParsingCsv] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setOffer('');
      setMessage(DEFAULT_MESSAGE);
      setAudience('all');
      setSegmentFilters({});
      setContactsPreview(null);
      setErrors({});
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [open]);

  useEffect(() => {
    if (!open || audience === 'csv') return;
    let active = true;
    setCount(null);
    const t = setTimeout(() => {
      audienceCount(audience, audience === 'segment' ? segmentFilters : undefined)
        .then((c) => active && setCount(c))
        .catch(() => active && setCount(null));
    }, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [audience, segmentFilters, open]);

  useEffect(() => {
    if (audience !== 'csv') {
      setContactsPreview(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }, [audience]);

  async function handleFile(file: File) {
    setParsingCsv(true);
    try {
      const rows = await parseCsv(file);
      setContactsPreview(classifyContactRows(rows));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not parse CSV.');
    } finally {
      setParsingCsv(false);
    }
  }

  async function handleSubmit() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Name is required.';
    if (!message.trim()) next.message = 'Message is required.';
    if (audience === 'csv' && (!contactsPreview || contactsPreview.valid === 0)) {
      next.audience = 'Upload a CSV with at least one valid contact.';
    }
    if (audience === 'segment' && isEmptySegmentFilters(segmentFilters)) {
      next.audience = 'Set at least one filter for a segment audience.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const recipients =
      audience === 'csv'
        ? contactsPreview!.rows
            .filter((r) => r.status === 'valid' && r.phone)
            .map((r) => ({ name: r.name || null, phone: r.phone as string }))
        : undefined;

    setSaving(true);
    try {
      await createCampaign({
        name: name.trim(),
        offer: offer.trim() || undefined,
        message: message.trim(),
        audience_type: audience,
        recipients,
        segment_filters: audience === 'segment' ? segmentFilters : undefined,
      });
      toast.success('Campaign created.');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create campaign.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New campaign"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Create campaign
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Campaign name" htmlFor="c_name" required error={errors.name}>
          <input
            id="c_name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dental Cleaning Offer"
          />
        </Field>

        <Field label="Offer" htmlFor="c_offer" hint="Fills the {{offer}} placeholder.">
          <input
            id="c_offer"
            className="input"
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            placeholder="e.g. 30% OFF Dental Cleaning"
          />
        </Field>

        <Field
          label="Message"
          htmlFor="c_message"
          required
          error={errors.message}
          hint="Placeholders: {{patient_name}}, {{offer}}, {{clinic_name}}"
        >
          <textarea
            id="c_message"
            className="input min-h-[120px] resize-y"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </Field>

        <Field label="Audience" htmlFor="c_audience" error={errors.audience}>
          <select
            id="c_audience"
            className="input"
            value={audience}
            onChange={(e) => setAudience(e.target.value as AudienceType)}
          >
            {(['all', 'recent', 'inactive', 'segment', 'csv'] as AudienceType[]).map((a) => (
              <option key={a} value={a}>
                {AUDIENCE_LABEL[a]}
              </option>
            ))}
          </select>
          {audience !== 'csv' && (
            <p className="mt-1 text-xs text-brand-ink-400">
              {count === null ? 'Counting recipients…' : `${count} recipient${count === 1 ? '' : 's'}`}
            </p>
          )}
        </Field>

        {audience === 'segment' && (
          <SegmentFilterBuilder value={segmentFilters} onChange={setSegmentFilters} />
        )}

        {audience === 'csv' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-ink-200 py-8 hover:border-brand-green-400 hover:bg-brand-green-50/40"
            >
              <UploadCloud className="h-6 w-6 text-brand-ink-300" />
              <span className="text-sm font-medium text-brand-ink-700">
                {parsingCsv ? 'Reading…' : 'Choose a CSV file'}
              </span>
              <span className="text-xs text-brand-ink-400">
                Columns: <code>name</code> (optional), <code>phone</code> (required)
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />

            {contactsPreview && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-brand-ink-100 p-2 text-center">
                    <p className="text-lg font-bold text-brand-green-700">{contactsPreview.valid}</p>
                    <p className="text-xs text-brand-ink-400">Valid</p>
                  </div>
                  <div className="rounded-lg border border-brand-ink-100 p-2 text-center">
                    <p className="text-lg font-bold text-amber-600">{contactsPreview.duplicates}</p>
                    <p className="text-xs text-brand-ink-400">Duplicates</p>
                  </div>
                  <div className="rounded-lg border border-brand-ink-100 p-2 text-center">
                    <p className="text-lg font-bold text-red-600">{contactsPreview.invalid}</p>
                    <p className="text-xs text-brand-ink-400">Invalid</p>
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-brand-ink-100">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-white text-xs uppercase tracking-wide text-brand-ink-400">
                      <tr>
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Phone</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-ink-50">
                      {contactsPreview.rows.slice(0, 50).map((r, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-brand-ink-700">{r.name || '—'}</td>
                          <td className="px-3 py-2 text-brand-ink-600">{r.phone ?? '—'}</td>
                          <td className="px-3 py-2">
                            <Badge
                              tone={
                                r.status === 'valid' ? 'green' : r.status === 'duplicate' ? 'amber' : 'red'
                              }
                            >
                              {r.status === 'valid' ? 'Valid' : r.reason}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {contactsPreview.rows.length > 50 && (
                  <p className="text-xs text-brand-ink-400">
                    Showing first 50 of {contactsPreview.total} rows.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
