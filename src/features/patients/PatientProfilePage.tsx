import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  MessageCircle,
  Phone,
  StickyNote,
  ListChecks,
  CalendarPlus,
  UserPlus,
  Star,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/format';
import { getPatient, updatePatient, setCustomerStatus } from './api';
import { PatientForm } from './PatientForm';
import { GENDER_LABEL, LEAD_SOURCE_LABEL, CUSTOMER_STATUS_LABEL, CUSTOMER_STATUS_TONE } from './labels';
import { PatientAppointmentsSection } from '@/features/appointments/PatientAppointmentsSection';
import { AppointmentForm } from '@/features/appointments/AppointmentForm';
import { TreatmentHistorySection } from '@/features/treatments/TreatmentHistorySection';
import { PatientWhatsappSection } from '@/features/whatsapp/PatientWhatsappSection';
import { SendWhatsappModal } from '@/features/whatsapp/SendWhatsappModal';
import { sendReviewToPatient } from '@/features/whatsapp/api';
import { FamilyProfileSection } from '@/features/families/FamilyProfileSection';
import { FollowUpsSection } from '@/features/followups/FollowUpsSection';
import { ActivityTimeline } from '@/features/timeline/ActivityTimeline';
import type { CustomerStatus, Patient } from './types';

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
  const toast = useToast();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [treatKey, setTreatKey] = useState(0);
  const [waKey, setWaKey] = useState(0);
  const [waOpen, setWaOpen] = useState(false);
  const [apptOpen, setApptOpen] = useState(false);
  const [apptKey, setApptKey] = useState(0);
  const [familyAddOpen, setFamilyAddOpen] = useState(false);
  const [followUpAddOpen, setFollowUpAddOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [sendingReview, setSendingReview] = useState(false);

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

  async function handleStatusChange(status: CustomerStatus) {
    if (!patient) return;
    try {
      await setCustomerStatus(patient.id, status);
      setPatient((p) => (p ? { ...p, customer_status: status } : p));
      toast.success('Customer status updated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update status.');
    }
  }

  async function handleAddNote() {
    if (!patient || !noteText.trim()) return;
    setSavingNote(true);
    try {
      const stamp = new Date().toLocaleString();
      const merged = patient.notes ? `${patient.notes}\n\n[${stamp}] ${noteText.trim()}` : `[${stamp}] ${noteText.trim()}`;
      const saved = await updatePatient(patient.id, {
        full_name: patient.full_name,
        phone: patient.phone,
        email: patient.email,
        date_of_birth: patient.date_of_birth,
        preferred_language: patient.preferred_language,
        notes: merged,
        customer_type: patient.customer_type,
        gender: patient.gender,
        lead_source: patient.lead_source,
        preferred_doctor_id: patient.preferred_doctor_id,
        preferred_service_id: patient.preferred_service_id,
      });
      setPatient(saved);
      toast.success('Note added.');
      setNoteText('');
      setNoteOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add note.');
    } finally {
      setSavingNote(false);
    }
  }

  async function handleSendReview() {
    if (!patient) return;
    setSendingReview(true);
    try {
      const res = await sendReviewToPatient(patient.id);
      if (res.ok) toast.success('Review request sent.');
      else toast.error(`Not sent: ${res.error ?? 'unknown error'}`);
      setWaKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not send review request.');
    } finally {
      setSendingReview(false);
    }
  }

  function scrollToTimeline() {
    document.getElementById('patient-timeline')?.scrollIntoView({ behavior: 'smooth' });
  }

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
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-brand-ink-500">
            <span>{patient.phone}</span>
            <Badge tone={patient.preferred_language === 'ar' ? 'amber' : 'gray'}>
              {patient.preferred_language === 'ar' ? 'Arabic' : 'English'}
            </Badge>
            <Badge tone={patient.customer_type === 'family' ? 'sky' : 'gray'}>
              {patient.customer_type === 'family' ? 'Family' : 'Individual'}
            </Badge>
            <select
              className="input w-auto py-1 text-xs"
              value={patient.customer_status}
              onChange={(e) => void handleStatusChange(e.target.value as CustomerStatus)}
            >
              {(Object.keys(CUSTOMER_STATUS_LABEL) as CustomerStatus[]).map((s) => (
                <option key={s} value={s}>
                  {CUSTOMER_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <Badge tone={CUSTOMER_STATUS_TONE[patient.customer_status]}>
              {CUSTOMER_STATUS_LABEL[patient.customer_status]}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        </div>
      </div>

      {/* Quick actions (spec §15) */}
      <div className="card flex flex-wrap gap-2 p-3">
        <Button variant="secondary" onClick={() => setWaOpen(true)}>
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </Button>
        <a href={`tel:${patient.phone}`} className="btn-secondary">
          <Phone className="h-4 w-4" /> Call
        </a>
        <Button variant="secondary" onClick={() => setNoteOpen(true)}>
          <StickyNote className="h-4 w-4" /> Add Note
        </Button>
        <Button variant="secondary" onClick={() => setFollowUpAddOpen(true)}>
          <ListChecks className="h-4 w-4" /> Add Follow-up
        </Button>
        <Button variant="secondary" onClick={() => setApptOpen(true)}>
          <CalendarPlus className="h-4 w-4" /> Add Appointment
        </Button>
        {patient.family_id && (
          <Button variant="secondary" onClick={() => setFamilyAddOpen(true)}>
            <UserPlus className="h-4 w-4" /> Add Family Member
          </Button>
        )}
        <Button variant="secondary" onClick={() => void handleSendReview()} loading={sendingReview}>
          <Star className="h-4 w-4" /> Send Review
        </Button>
        <Button variant="secondary" onClick={scrollToTimeline}>
          <History className="h-4 w-4" /> View Timeline
        </Button>
      </div>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-brand-ink-700">Patient information</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <InfoRow label="Full name" value={patient.full_name} />
          <InfoRow label="Phone" value={patient.phone} />
          <InfoRow label="Email" value={patient.email ?? '—'} />
          <InfoRow label="Date of birth" value={formatDate(patient.date_of_birth)} />
          <InfoRow label="Gender" value={patient.gender ? GENDER_LABEL[patient.gender] : '—'} />
          <InfoRow
            label="Lead source"
            value={patient.lead_source ? LEAD_SOURCE_LABEL[patient.lead_source] : '—'}
          />
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

      {patient.family_id && (
        <FamilyProfileSection
          familyId={patient.family_id}
          currentPatientId={patient.id}
          addOpen={familyAddOpen}
          onAddOpenChange={setFamilyAddOpen}
        />
      )}

      <div key={apptKey}>
        <PatientAppointmentsSection
          patient={{ id: patient.id, full_name: patient.full_name, phone: patient.phone }}
          onChanged={() => setTreatKey((k) => k + 1)}
        />
      </div>

      <TreatmentHistorySection patientId={patient.id} refreshKey={treatKey} />

      <FollowUpsSection
        patientId={patient.id}
        addOpen={followUpAddOpen}
        onAddOpenChange={setFollowUpAddOpen}
      />

      <PatientWhatsappSection patientId={patient.id} refreshKey={waKey} />

      <div id="patient-timeline">
        <ActivityTimeline patientId={patient.id} />
      </div>

      <PatientForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={(p) => setPatient(p)}
        patient={patient}
      />

      <AppointmentForm
        open={apptOpen}
        onClose={() => setApptOpen(false)}
        onSaved={() => {
          setApptKey((k) => k + 1);
          setTreatKey((k) => k + 1);
        }}
        lockedPatient={{ id: patient.id, full_name: patient.full_name, phone: patient.phone }}
      />

      <SendWhatsappModal
        open={waOpen}
        onClose={() => setWaOpen(false)}
        onSent={() => setWaKey((k) => k + 1)}
        patient={{ id: patient.id, full_name: patient.full_name, phone: patient.phone }}
      />

      <Modal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title="Add note"
        footer={
          <>
            <Button variant="secondary" onClick={() => setNoteOpen(false)} disabled={savingNote}>
              Cancel
            </Button>
            <Button onClick={() => void handleAddNote()} loading={savingNote}>
              Add note
            </Button>
          </>
        }
      >
        <Field label="Note" htmlFor="quick_note">
          <textarea
            id="quick_note"
            className="input min-h-[100px] resize-y"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Type a note…"
          />
        </Field>
      </Modal>
    </div>
  );
}
