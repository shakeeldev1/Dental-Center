import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/format';
import { getPatient } from './api';
import { PatientForm } from './PatientForm';
import { PatientAppointmentsSection } from '@/features/appointments/PatientAppointmentsSection';
import { TreatmentHistorySection } from '@/features/treatments/TreatmentHistorySection';
import { PatientWhatsappSection } from '@/features/whatsapp/PatientWhatsappSection';
import { SendWhatsappModal } from '@/features/whatsapp/SendWhatsappModal';
import type { Patient } from './types';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-brand-ink-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-brand-ink-800">{value}</dd>
    </div>
  );
}

export function PatientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [treatKey, setTreatKey] = useState(0);
  const [waKey, setWaKey] = useState(0);
  const [waOpen, setWaOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setPatient(await getPatient(id));
      setNotFound(false);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  if (notFound || !patient) {
    return (
      <div className="space-y-4">
        <button className="btn-ghost -ml-2" onClick={() => navigate('/patients')}>
          <ArrowLeft className="h-4 w-4" /> Back to patients
        </button>
        <EmptyState title="Patient not found." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button className="btn-ghost -ml-2" onClick={() => navigate('/patients')}>
        <ArrowLeft className="h-4 w-4" /> Back to patients
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink-800">{patient.full_name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-brand-ink-500">
            <span>{patient.phone}</span>
            <Badge tone={patient.preferred_language === 'ar' ? 'amber' : 'gray'}>
              {patient.preferred_language === 'ar' ? 'Arabic' : 'English'}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setWaOpen(true)}>
            <MessageCircle className="h-4 w-4" /> Send WhatsApp
          </Button>
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        </div>
      </div>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-brand-ink-700">Patient information</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <InfoRow label="Full name" value={patient.full_name} />
          <InfoRow label="Phone" value={patient.phone} />
          <InfoRow label="Email" value={patient.email ?? '—'} />
          <InfoRow label="Date of birth" value={formatDate(patient.date_of_birth)} />
          <InfoRow
            label="Preferred language"
            value={patient.preferred_language === 'ar' ? 'Arabic' : 'English'}
          />
          <InfoRow label="Added" value={formatDate(patient.created_at)} />
        </dl>
        {patient.notes && (
          <div className="mt-4 border-t border-brand-ink-50 pt-4">
            <dt className="text-xs uppercase tracking-wide text-brand-ink-400">Notes</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-brand-ink-700">{patient.notes}</dd>
          </div>
        )}
      </section>

      <PatientAppointmentsSection
        patient={{ id: patient.id, full_name: patient.full_name, phone: patient.phone }}
        onChanged={() => setTreatKey((k) => k + 1)}
      />

      <TreatmentHistorySection patientId={patient.id} refreshKey={treatKey} />

      <PatientWhatsappSection patientId={patient.id} refreshKey={waKey} />

      <PatientForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={(p) => setPatient(p)}
        patient={patient}
      />

      <SendWhatsappModal
        open={waOpen}
        onClose={() => setWaOpen(false)}
        onSent={() => setWaKey((k) => k + 1)}
        patient={{ id: patient.id, full_name: patient.full_name, phone: patient.phone }}
      />
    </div>
  );
}
