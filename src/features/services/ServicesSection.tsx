import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { listServices, createService, updateService, setServiceActive } from './api';
import type { Service } from './types';

export function ServicesSection() {
  const toast = useToast();
  const [rows, setRows] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | 'new' | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await listServices());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load services.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  function openNew() {
    setName('');
    setCategory('');
    setDuration('');
    setPrice('');
    setEditing('new');
  }

  function openEdit(s: Service) {
    setName(s.name);
    setCategory(s.category ?? '');
    setDuration(s.duration_minutes != null ? String(s.duration_minutes) : '');
    setPrice(s.price != null ? String(s.price) : '');
    setEditing(s);
  }

  async function save() {
    if (!name.trim()) {
      toast.error('Service name is required.');
      return;
    }
    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        category: category.trim() || null,
        duration_minutes: duration.trim() ? parseInt(duration, 10) : null,
        price: price.trim() ? Number(price) : null,
      };
      if (editing === 'new') {
        await createService({ ...input, is_active: true });
        toast.success('Service added.');
      } else if (editing) {
        await updateService(editing.id, { ...input, is_active: editing.is_active });
        toast.success('Service updated.');
      }
      setEditing(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save service.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(s: Service) {
    try {
      await setServiceActive(s.id, !s.is_active);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update service.');
    }
  }

  return (
    <section className="card space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-brand-ink-700">Services</h2>
        <Button variant="secondary" onClick={openNew}>
          <Plus className="h-4 w-4" /> Add service
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="No services yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand-ink-100 text-xs uppercase tracking-wide text-brand-ink-400">
              <tr>
                <th className="py-2 pr-3 font-medium">Name</th>
                <th className="py-2 pr-3 font-medium">Category</th>
                <th className="py-2 pr-3 font-medium">Duration</th>
                <th className="py-2 pr-3 font-medium">Price</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-ink-50">
              {rows.map((s) => (
                <tr key={s.id}>
                  <td className="py-2 pr-3 font-medium text-brand-ink-800">{s.name}</td>
                  <td className="py-2 pr-3 text-brand-ink-600">{s.category ?? '—'}</td>
                  <td className="py-2 pr-3 text-brand-ink-600">
                    {s.duration_minutes != null ? `${s.duration_minutes} min` : '—'}
                  </td>
                  <td className="py-2 pr-3 text-brand-ink-600">
                    {s.price != null ? s.price.toFixed(2) : '—'}
                  </td>
                  <td className="py-2 pr-3">
                    <Badge tone={s.is_active ? 'green' : 'gray'}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => openEdit(s)}>
                        Edit
                      </Button>
                      <Button variant="secondary" onClick={() => void toggleActive(s)}>
                        {s.is_active ? 'Deactivate' : 'Activate'}
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
        title={editing === 'new' ? 'Add service' : 'Edit service'}
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
          <Field label="Service name" htmlFor="service_name" required>
            <input
              id="service_name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dental cleaning"
            />
          </Field>
          <Field label="Category" htmlFor="service_category">
            <input
              id="service_category"
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Orthodontics"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Duration (minutes)" htmlFor="service_duration" hint="Optional">
              <input
                id="service_duration"
                type="number"
                min={0}
                className="input"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </Field>
            <Field label="Price" htmlFor="service_price" hint="Optional">
              <input
                id="service_price"
                type="number"
                min={0}
                step="0.01"
                className="input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>
          </div>
        </div>
      </Modal>
    </section>
  );
}
