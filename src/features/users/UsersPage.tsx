import { useCallback, useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { listUsers, setUserActive, setUserRole, deleteUser, type StaffUser } from './api';
import { NewUserModal } from './NewUserModal';
import type { Role } from '@/types';

export function UsersPage() {
  const toast = useToast();
  const { profile } = useAuth();
  const [rows, setRows] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<StaffUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await listUsers());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load users.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleActive(u: StaffUser) {
    try {
      await setUserActive(u.id, !u.is_active);
      toast.success(u.is_active ? 'Account deactivated.' : 'Account activated.');
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update account.');
    }
  }

  async function changeRole(u: StaffUser, role: Role) {
    try {
      await setUserRole(u.id, role);
      toast.success('Role updated.');
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update role.');
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteUser(pendingDelete.id);
      toast.success('User deleted.');
      setPendingDelete(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete user.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink-800">Users</h1>
          <p className="text-sm text-brand-ink-400">Staff accounts</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <UserPlus className="h-4 w-4" />
          New user
        </Button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-7 w-7" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No users yet." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-ink-100 text-xs uppercase tracking-wide text-brand-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-ink-50">
                {rows.map((u) => {
                  const isSelf = u.id === profile?.id;
                  return (
                    <tr key={u.id} className="hover:bg-brand-ink-50/50">
                      <td className="px-4 py-3 font-medium text-brand-ink-800">
                        {u.full_name}
                        {isSelf && <span className="ml-2 text-xs text-brand-ink-400">(you)</span>}
                      </td>
                      <td className="px-4 py-3 text-brand-ink-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <select
                          className="input w-36 py-1"
                          value={u.role}
                          disabled={isSelf}
                          onChange={(e) => void changeRole(u, e.target.value as Role)}
                        >
                          <option value="receptionist">Receptionist</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={u.is_active ? 'green' : 'gray'}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant={u.is_active ? 'secondary' : 'primary'}
                            onClick={() => void toggleActive(u)}
                            disabled={isSelf}
                            title={isSelf ? 'You cannot deactivate your own account' : undefined}
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => setPendingDelete(u)}
                            disabled={isSelf}
                            title={isSelf ? 'You cannot delete your own account' : undefined}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewUserModal open={formOpen} onClose={() => setFormOpen(false)} onCreated={() => void load()} />

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Delete user"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void confirmDelete()} loading={deleting}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-brand-ink-600">
          Are you sure you want to permanently delete{' '}
          <span className="font-medium text-brand-ink-800">{pendingDelete?.full_name}</span> (
          {pendingDelete?.email})? This will remove their login and cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
