import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { listDoctors, createDoctor, updateDoctor, setDoctorActive } from './api';
import type { Doctor } from './types';

export function DoctorsSection() {
  const toast = useToast();
  const [rows, setRows] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Doctor | 'new' | null>(null);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await listDoctors());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load doctors.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  function openNew() {
    setName('');
    setSpecialty('');
    setEditing('new');
  }

  function openEdit(d: Doctor) {
    setName(d.full_name);
    setSpecialty(d.specialty ?? '');
    setEditing(d);
  }

  async function save() {
    if (!name.trim()) {
      toast.error('Doctor name is required.');
      return;
    }
    setSaving(true);
    try {
      if (editing === 'new') {
        await createDoctor({ full_name: name.trim(), specialty: specialty.trim() || null, is_active: true });
        toast.success('Doctor added.');
      } else if (editing) {
        await updateDoctor(editing.id, {
          full_name: name.trim(),
          specialty: specialty.trim() || null,
          is_active: editing.is_active,
        });
        toast.success('Doctor updated.');
      }
      setEditing(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save doctor.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(d: Doctor) {
    try {
      await setDoctorActive(d.id, !d.is_active);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update doctor.');
    }
  }

  return (
    <section className="card space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-brand-ink-700">Doctors</h2>
        <Button variant="secondary" onClick={openNew}>
          <Plus className="h-4 w-4" /> Add doctor
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="No doctors yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand-ink-100 text-xs uppercase tracking-wide text-brand-ink-400">
              <tr>
                <th className="py-2 pr-3 font-medium">Name</th>
                <th className="py-2 pr-3 font-medium">Specialty</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-ink-50">
              {rows.map((d) => (
                <tr key={d.id}>
                  <td className="py-2 pr-3 font-medium text-brand-ink-800">{d.full_name}</td>
                  <td className="py-2 pr-3 text-brand-ink-600">{d.specialty ?? '—'}</td>
                  <td className="py-2 pr-3">
                    <Badge tone={d.is_active ? 'green' : 'gray'}>
                      {d.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => openEdit(d)}>
                        Edit
                      </Button>
                      <Button variant="secondary" onClick={() => void toggleActive(d)}>
                        {d.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add doctor' : 'Edit doctor'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void save()} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Doctor name" htmlFor="doctor_name" required>
            <input
              id="doctor_name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dr. Sara Ahmed"
            />
          </Field>
          <Field label="Specialty" htmlFor="doctor_specialty">
            <input
              id="doctor_specialty"
              className="input"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. Orthodontics"
            />
          </Field>
        </div>
      </Modal>
    </section>
  );
}
