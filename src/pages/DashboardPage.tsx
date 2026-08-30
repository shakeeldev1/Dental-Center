import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock, XCircle, CircleCheck } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { formatDate, formatTime } from '@/lib/format';
import { getTodayAppointments, getUpcomingAppointments } from '@/features/dashboard/api';
import { STATUS_META } from '@/features/appointments/status';
import type { AppointmentDetails, AppointmentStatus } from '@/features/appointments/types';

function AppointmentRow({ a, showDate }: { a: AppointmentDetails; showDate?: boolean }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/patients/${a.patient_id}`)}
      className="flex w-full items-center justify-between border-b border-brand-ink-50 px-4 py-3 text-left last:border-0 hover:bg-brand-ink-50/50"
    >
      <div>
        <p className="text-sm font-medium text-brand-ink-800">{a.patient_name}</p>
        <p className="text-xs text-brand-ink-400">
          {showDate ? `${formatDate(a.scheduled_at)}, ` : ''}
          {formatTime(a.scheduled_at)}
          {a.doctor_name ? ` · ${a.doctor_name}` : ''}
        </p>
      </div>
      <Badge tone={STATUS_META[a.status].tone}>{STATUS_META[a.status].label}</Badge>
    </button>
  );
}

export function DashboardPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const [today, setToday] = useState<AppointmentDetails[]>([]);
  const [upcoming, setUpcoming] = useState<AppointmentDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [t, u] = await Promise.all([getTodayAppointments(), getUpcomingAppointments()]);
        if (!active) return;
        setToday(t);
        setUpcoming(u);
      } catch (err) {
        if (active) toast.error(err instanceof Error ? err.message : 'Could not load dashboard.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [toast]);

  const counts = useMemo(() => {
    const by = (s: AppointmentStatus) => today.filter((a) => a.status === s).length;
    return {
      total: today.length,
      confirmed: by('confirmed'),
      pending: by('pending'),
      completed: by('completed'),
      no_show: by('no_show'),
    };
  }, [today]);

  const cards = [
    { label: "Today's Appointments", value: counts.total, icon: CalendarDays, tint: 'text-brand-green-600' },
    { label: 'Confirmed', value: counts.confirmed, icon: CheckCircle2, tint: 'text-emerald-600' },
    { label: 'Pending', value: counts.pending, icon: Clock, tint: 'text-amber-600' },
    { label: 'Completed', value: counts.completed, icon: CircleCheck, tint: 'text-sky-600' },
    { label: 'No Show', value: counts.no_show, icon: XCircle, tint: 'text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink-800">
          Welcome{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-brand-ink-400">Here is today at Expert Dental Center.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map(({ label, value, icon: Icon, tint }) => (
          <div key={label} className="card p-4">
            <Icon className={`h-6 w-6 ${tint}`} />
            <p className="mt-3 text-2xl font-bold text-brand-ink-800">{loading ? '—' : value}</p>
            <p className="text-xs text-brand-ink-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-brand-ink-700">Today's Appointments</h2>
          {loading ? (
            <div className="card flex justify-center py-10">
              <Spinner />
            </div>
          ) : today.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No appointments today." />
          ) : (
            <div className="card overflow-hidden">
              {today.map((a) => (
                <AppointmentRow key={a.id} a={a} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-brand-ink-700">Upcoming Appointments</h2>
          {loading ? (
            <div className="card flex justify-center py-10">
              <Spinner />
            </div>
          ) : upcoming.length === 0 ? (
            <EmptyState icon={Clock} title="No upcoming appointments." />
          ) : (
            <div className="card overflow-hidden">
              {upcoming.map((a) => (
                <AppointmentRow key={a.id} a={a} showDate />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
