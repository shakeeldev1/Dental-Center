import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';

interface Props {
  open: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export function ForgotPasswordModal({ open, onClose, initialEmail = '' }: Props) {
  const toast = useToast();
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(initialEmail);
      setSent(false);
    }
  }, [open, initialEmail]);

  async function handleSubmit() {
    if (!supabase) {
      toast.error('Supabase is not configured.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Enter a valid email.');
      return;
    }
    setSending(true);
    try {
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      // Do not reveal whether the email exists.
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reset password"
      footer={
        sent ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={sending}>
              Send reset link
            </Button>
          </>
        )
      }
    >
      {sent ? (
        <p className="text-sm text-brand-ink-600">
          If an account exists for <span className="font-medium">{email}</span>, a password reset
          link has been sent. Check the inbox and follow the link to set a new password.
        </p>
      ) : (
        <Field label="Email" htmlFor="fp_email" required>
          <input
            id="fp_email"
            type="email"
            autoComplete="username"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@clinic.com"
          />
        </Field>
      )}
    </Modal>
  );
}
