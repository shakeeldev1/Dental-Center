import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { clinicToday } from '@/lib/clinic';
import { listStaffDirectory, type StaffDirectoryEntry } from '@/features/users/api';
import { createFollowUp } from './api';
import type { FollowUpPriority } from './types';

interface Props {
  open: boolean;
  onClose: () => void;
  patientId: string;
  onAdded: () => void;
}

export function AddFollowUpModal({ open, onClose, patientId, onAdded }: Props) {
  const toast = useToast();
  const [task, setTask] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<FollowUpPriority>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [staff, setStaff] = useState<StaffDirectoryEntry[]>([]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTask('');
    setDueDate(clinicToday());
    setPriority('medium');
    setAssignedTo('');
    setNotes('');
    setErrors({});
    listStaffDirectory().then(setStaff).catch(() => setStaff([]));
  }, [open]);

  async function handleSubmit() {
    const next: Record<string, string> = {};
    if (!task.trim()) next.task = 'Task is required.';
    if (!dueDate) next.dueDate = 'Due date is required.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await createFollowUp({
        patient_id: patientId,
        task: task.trim(),
        due_date: dueDate,
        priority,
        assigned_to: assignedTo || null,
        notes: notes.trim() || null,
      });
      toast.success('Follow-up created.');
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create follow-up.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add follow-up"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Create follow-up
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Task" htmlFor="fu_task" required error={errors.task}>
          <input
            id="fu_task"
            className="input"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="e.g. Call regarding orthodontics"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Due date" htmlFor="fu_due" required error={errors.dueDate}>
            <input
              id="fu_due"
              type="date"
              className="input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
          <Field label="Priority" htmlFor="fu_priority">
            <select
              id="fu_priority"
              className="input"
              value={priority}
              onChange={(e) => setPriority(e.target.value as FollowUpPriority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
        </div>

        <Field label="Assigned staff" htmlFor="fu_assigned" hint="Optional — leave blank for Reception in general.">
          <select
            id="fu_assigned"
            className="input"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          >
            <option value="">Reception (unassigned)</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name} {s.role === 'admin' ? '(Admin)' : ''}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Notes" htmlFor="fu_notes">
          <textarea
            id="fu_notes"
            className="input min-h-[70px] resize-y"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
