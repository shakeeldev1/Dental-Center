import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ open, onClose }: Props) {
  const toast = useToast();
  const { profile } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrent('');
      setNext('');
      setConfirm('');
      setErrors({});
    }
  }, [open]);

  async function handleSubmit() {
    const nextErrors: Record<string, string> = {};
    if (!current) nextErrors.current = 'Enter your current password.';
    if (next.length < 8) nextErrors.next = 'At least 8 characters.';
    if (next !== confirm) nextErrors.confirm = 'Passwords do not match.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!supabase || !profile) {
      toast.error('Not signed in.');
      return;
    }

    setSaving(true);
    try {
      // Re-authenticate with the current password before allowing a change.
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: current,
      });
      if (signInErr) {
        setErrors({ current: 'Current password is incorrect.' });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw new Error(error.message);

      toast.success('Password changed.');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not change password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change password"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Update password
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Current password" htmlFor="cp_current" required error={errors.current}>
          <input
            id="cp_current"
            type="password"
            autoComplete="current-password"
            className="input"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </Field>
        <Field label="New password" htmlFor="cp_next" required error={errors.next}>
          <input
            id="cp_next"
            type="password"
            autoComplete="new-password"
            className="input"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </Field>
        <Field label="Confirm new password" htmlFor="cp_confirm" required error={errors.confirm}>
          <input
            id="cp_confirm"
            type="password"
            autoComplete="new-password"
            className="input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
