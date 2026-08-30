import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { audienceCount, createCampaign } from './api';
import { AUDIENCE_LABEL, type AudienceType } from './types';

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
  const [count, setCount] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setOffer('');
      setMessage(DEFAULT_MESSAGE);
      setAudience('all');
      setErrors({});
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setCount(null);
    audienceCount(audience)
      .then((c) => active && setCount(c))
      .catch(() => active && setCount(null));
    return () => {
      active = false;
    };
  }, [audience, open]);

  async function handleSubmit() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Name is required.';
    if (!message.trim()) next.message = 'Message is required.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await createCampaign({
        name: name.trim(),
        offer: offer.trim() || undefined,
        message: message.trim(),
        audience_type: audience,
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

        <Field label="Audience" htmlFor="c_audience">
          <select
            id="c_audience"
            className="input"
            value={audience}
            onChange={(e) => setAudience(e.target.value as AudienceType)}
          >
            {(['all', 'recent', 'inactive'] as AudienceType[]).map((a) => (
              <option key={a} value={a}>
                {AUDIENCE_LABEL[a]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-brand-ink-400">
            {count === null ? 'Counting recipients…' : `${count} recipient${count === 1 ? '' : 's'}`}
          </p>
        </Field>
      </div>
    </Modal>
  );
}
