import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { createUser } from './api';
import type { Role } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function NewUserModal({ open, onClose, onCreated }: Props) {
  const toast = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('receptionist');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('receptionist');
      setErrors({});
    }
  }, [open]);

  async function handleSubmit() {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = 'Full name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Valid email required.';
    if (password.length < 8) next.password = 'At least 8 characters.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await createUser({ email: email.trim(), password, full_name: fullName.trim(), role });
      toast.success('Staff account created.');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create user.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New staff account"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Create account
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Full name" htmlFor="u_name" required error={errors.fullName}>
          <input
            id="u_name"
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </Field>
        <Field label="Email" htmlFor="u_email" required error={errors.email}>
          <input
            id="u_email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field
          label="Temporary password"
          htmlFor="u_pw"
          required
          error={errors.password}
          hint="At least 8 characters. Share it securely with the staff member."
        >
          <input
            id="u_pw"
            type="text"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Role" htmlFor="u_role">
          <select
            id="u_role"
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="receptionist">Receptionist</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
      </div>
    </Modal>
  );
}
