import { useEffect, useRef, useState } from 'react';
import { UploadCloud, ImagePlus, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { audienceCount, createCampaign } from './api';
import { AUDIENCE_LABEL, type AudienceType } from './types';
import { parseCsv, classifyContactRows, guessContactMapping, type ContactsPreview, type ContactColumnMapping } from './contacts';
import { SegmentFilterBuilder } from './SegmentFilterBuilder';
import { isEmptySegmentFilters, type SegmentFilters } from '@/features/patients/segment';
import { uploadCampaignImage } from './media';

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
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRawRows, setCsvRawRows] = useState<Record<string, string>[]>([]);
  const [contactMapping, setContactMapping] = useState<ContactColumnMapping>({ name: null, phone: null });
  const [contactsPreview, setContactsPreview] = useState<ContactsPreview | null>(null);
  const [parsingCsv, setParsingCsv] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dailyLimit, setDailyLimit] = useState('');
  const [sendInterval, setSendInterval] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setOffer('');
      setMessage(DEFAULT_MESSAGE);
      setAudience('all');
      setSegmentFilters({});
      setCsvHeaders([]);
      setCsvRawRows([]);
      setContactMapping({ name: null, phone: null });
      setContactsPreview(null);
      setImageFile(null);
      setImagePreviewUrl(null);
      setDailyLimit('');
      setSendInterval('');
      setErrors({});
      if (fileRef.current) fileRef.current.value = '';
      if (imageRef.current) imageRef.current.value = '';
    }
  }, [open]);

  // Revoke the local object URL when replaced/closed to avoid leaking memory.
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

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
      const { rawRows, headers } = await parseCsv(file);
      setCsvRawRows(rawRows);
      setCsvHeaders(headers);
      const guess = guessContactMapping(headers);
      setContactMapping(guess);
      setContactsPreview(guess.phone ? classifyContactRows(rawRows, guess) : null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not parse CSV.');
    } finally {
      setParsingCsv(false);
    }
  }

  function applyContactMapping(next: ContactColumnMapping) {
    setContactMapping(next);
    if (next.phone) setContactsPreview(classifyContactRows(csvRawRows, next));
  }

  function handleImageSelect(file: File) {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  function removeImage() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
    if (imageRef.current) imageRef.current.value = '';
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
      let image_url: string | undefined;
      if (imageFile) {
        setUploadingImage(true);
        try {
          image_url = await uploadCampaignImage(imageFile);
        } finally {
          setUploadingImage(false);
        }
      }

      await createCampaign({
        name: name.trim(),
        offer: offer.trim() || undefined,
        message: message.trim(),
        audience_type: audience,
        recipients,
        segment_filters: audience === 'segment' ? segmentFilters : undefined,
        image_url,
        daily_limit: dailyLimit.trim() ? parseInt(dailyLimit, 10) : undefined,
        send_interval_seconds: sendInterval.trim() ? parseInt(sendInterval, 10) : undefined,
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
          <Button onClick={handleSubmit} loading={saving || uploadingImage}>
            {uploadingImage ? 'Uploading image…' : 'Create campaign'}
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

        <Field label="Image (optional)" htmlFor="c_image" hint="Sent as an image attachment with the message as its caption.">
          {imagePreviewUrl ? (
            <div className="flex items-start gap-3 rounded-lg border border-brand-ink-200 p-2">
              <img src={imagePreviewUrl} alt="Campaign attachment preview" className="h-20 w-20 rounded-md object-cover" />
              <div className="flex-1 text-xs text-brand-ink-500">
                <p className="font-medium text-brand-ink-700">{imageFile?.name}</p>
                <p className="mt-1 whitespace-pre-wrap">{message || 'Message preview will appear here.'}</p>
              </div>
              <button type="button" onClick={removeImage} className="btn-ghost p-1.5" aria-label="Remove image">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => imageRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand-ink-200 py-4 text-sm text-brand-ink-600 hover:border-brand-green-400 hover:bg-brand-green-50/40"
            >
              <ImagePlus className="h-4 w-4" /> Attach an image
            </button>
          )}
          <input
            ref={imageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImageSelect(f);
            }}
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

            {csvHeaders.length > 0 && (!contactMapping.phone || contactsPreview === null) && (
              <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-800">
                  We couldn&apos;t confidently detect the phone column. Please confirm the columns below.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Name column" htmlFor="csv_name_col">
                    <select
                      id="csv_name_col"
                      className="input"
                      value={contactMapping.name ?? ''}
                      onChange={(e) =>
                        applyContactMapping({ ...contactMapping, name: e.target.value || null })
                      }
                    >
                      <option value="">None</option>
                      {csvHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Phone column" htmlFor="csv_phone_col" required>
                    <select
                      id="csv_phone_col"
                      className="input"
                      value={contactMapping.phone ?? ''}
                      onChange={(e) =>
                        applyContactMapping({ ...contactMapping, phone: e.target.value || null })
                      }
                    >
                      <option value="">Select a column…</option>
                      {csvHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {contactsPreview && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-ink-400">
                    Mapped: Name → {contactMapping.name ?? 'none'}, Phone → {contactMapping.phone}
                  </span>
                  <button
                    type="button"
                    className="text-xs font-medium text-brand-green-700 hover:underline"
                    onClick={() => setContactsPreview(null)}
                  >
                    Remap columns
                  </button>
                </div>
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Daily sending limit"
            htmlFor="c_daily_limit"
            hint="Optional — leave blank to use the Settings default."
          >
            <input
              id="c_daily_limit"
              type="number"
              min={1}
              className="input"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
            />
          </Field>
          <Field
            label="Interval between messages (seconds)"
            htmlFor="c_send_interval"
            hint="Optional — leave blank to use the Settings default."
          >
            <input
              id="c_send_interval"
              type="number"
              min={1}
              className="input"
              value={sendInterval}
              onChange={(e) => setSendInterval(e.target.value)}
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
