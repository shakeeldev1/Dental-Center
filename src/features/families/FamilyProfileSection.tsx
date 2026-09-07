import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { listFamilyMembers } from '@/features/patients/api';
import type { Patient } from '@/features/patients/types';
import { getFamily } from './api';
import { FamilyMemberForm } from './FamilyMemberForm';
import type { Family } from './types';

export function FamilyProfileSection({
  familyId,
  currentPatientId,
  addOpen,
  onAddOpenChange,
}: {
  familyId: string;
  currentPatientId: string;
  addOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [f, m] = await Promise.all([getFamily(familyId), listFamilyMembers(familyId)]);
      setFamily(f);
      setMembers(m);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load family profile.');
    } finally {
      setLoading(false);
    }
  }, [familyId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="card space-y-3 p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-brand-ink-700">
          <Users className="h-4 w-4" /> {family?.family_name ?? 'Family profile'}
        </h2>
        <Button variant="secondary" onClick={() => onAddOpenChange(true)}>
          <UserPlus className="h-4 w-4" /> Add family member
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : (
        <div className="divide-y divide-brand-ink-50">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => m.id !== currentPatientId && navigate(`/patients/${m.id}`)}
              className={`flex w-full items-center justify-between py-2 text-left ${
                m.id === currentPatientId ? 'cursor-default' : 'hover:bg-brand-ink-50/50'
              }`}
            >
              <div>
                <span className="text-sm font-medium text-brand-ink-800">{m.full_name}</span>
                {m.id === currentPatientId && (
                  <span className="ml-2 text-xs text-brand-ink-400">(this profile)</span>
                )}
                <div className="text-xs text-brand-ink-400">{m.relationship ?? '—'}</div>
              </div>
              <Badge tone="gray">{m.phone}</Badge>
            </button>
          ))}
        </div>
      )}

      <FamilyMemberForm
        open={addOpen}
        onClose={() => onAddOpenChange(false)}
        familyId={familyId}
        onAdded={() => void load()}
      />
    </section>
  );
}
