import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { sendManualMessage } from './api';

interface Props {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
  patient: { id: string; full_name: string; phone: string } | null;
}

export function SendWhatsappModal({ open, onClose, onSent, patient }: Props) {
  const toast = useToast();
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setMessage('');
      setError(null);
    }
  }, [open]);

  async function handleSend() {
    if (!patient) return;
    if (!message.trim()) {
      setError('Enter a message.');
      return;
    }
    setSending(true);
    try {
      const res = await sendManualMessage(patient.id, message.trim());
      if (res.ok) {
        toast.success('Message sent.');
        onSent();
        onClose();
      } else {
        toast.error(`Not sent: ${res.error ?? 'unknown error'}`);
        onSent(); // a failed attempt is still logged — refresh history
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Send failed.');
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send WhatsApp message"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} loading={sending}>
            Send
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {patient && (
          <p className="text-sm text-brand-ink-500">
            To <span className="font-medium text-brand-ink-800">{patient.full_name}</span> ·{' '}
            {patient.phone}
          </p>
        )}
        <Field label="Message" htmlFor="wa_message" required error={error ?? undefined}>
          <textarea
            id="wa_message"
            className="input min-h-[120px] resize-y"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message…"
          />
        </Field>
      </div>
    </Modal>
  );
}
