import { useEffect, useState } from 'react';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import {
  getSettings,
  updateSettings,
  listTemplates,
  updateTemplate,
  TEMPLATE_LABEL,
  type Settings,
  type Template,
} from './api';
import { DoctorsSection } from '@/features/doctors/DoctorsSection';
import { ServicesSection } from '@/features/services/ServicesSection';
import type { LanguageCode } from '@/types';

export function SettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [bodies, setBodies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingTpl, setSavingTpl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [s, t] = await Promise.all([getSettings(), listTemplates()]);
        if (!active) return;
        setSettings(s);
        setTemplates(t);
        setBodies(Object.fromEntries(t.map((x) => [x.id, x.body])));
      } catch (err) {
        if (active) toast.error(err instanceof Error ? err.message : 'Could not load settings.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [toast]);

  function patch<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  }

  async function saveSettings() {
    if (!settings) return;
    setSavingSettings(true);
    try {
      await updateSettings(settings);
      toast.success('Settings saved.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save settings.');
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveTemplate(id: string) {
    setSavingTpl(id);
    try {
      await updateTemplate(id, bodies[id] ?? '');
      toast.success('Template saved.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save template.');
    } finally {
      setSavingTpl(null);
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  const grouped = templates.reduce<Record<string, Template[]>>((acc, t) => {
    (acc[t.template_key] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-brand-ink-800">Settings</h1>

      {/* Clinic */}
      <section className="card space-y-4 p-5">
        <h2 className="text-sm font-semibold text-brand-ink-700">Clinic</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Clinic name" htmlFor="clinic_name">
            <input
              id="clinic_name"
              className="input"
              value={settings.clinic_name}
              onChange={(e) => patch('clinic_name', e.target.value)}
            />
          </Field>
          <Field label="Timezone" htmlFor="tz">
            <input
              id="tz"
              className="input"
              value={settings.clinic_timezone}
              onChange={(e) => patch('clinic_timezone', e.target.value)}
            />
          </Field>
          <Field label="Google Review URL" htmlFor="review_url">
            <input
              id="review_url"
              className="input"
              value={settings.google_review_url ?? ''}
              onChange={(e) => patch('google_review_url', e.target.value || null)}
              placeholder="https://g.page/r/…"
            />
          </Field>
          <Field label="Default language" htmlFor="lang">
            <select
              id="lang"
              className="input"
              value={settings.default_language}
              onChange={(e) => patch('default_language', e.target.value as LanguageCode)}
            >
              <option value="en">English</option>
              <option value="ar">Arabic</option>
            </select>
          </Field>
        </div>
      </section>

      {/* Reminders */}
      <section className="card space-y-4 p-5">
        <h2 className="text-sm font-semibold text-brand-ink-700">Reminders</h2>
        <div className="space-y-3">
          {(
            [
              ['reminder_24h_enabled', '24-hour reminder'],
              ['reminder_2h_enabled', '2-hour reminder'],
              ['treatment_reminder_enabled', 'Next-treatment reminder'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 text-sm text-brand-ink-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-brand-ink-300 text-brand-green-600"
                checked={settings[key]}
                onChange={(e) => patch(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
          <Field label="Treatment reminder — days before" htmlFor="days">
            <input
              id="days"
              type="number"
              min={1}
              className="input w-32"
              value={settings.treatment_reminder_days}
              onChange={(e) => patch('treatment_reminder_days', parseInt(e.target.value || '0', 10))}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Reminder 1 — hours before appointment"
              htmlFor="reminder_1_hours"
              hint="Only fires while the 24-hour reminder above is enabled."
            >
              <input
                id="reminder_1_hours"
                type="number"
                min={1}
                className="input"
                value={settings.reminder_1_hours_before}
                onChange={(e) => patch('reminder_1_hours_before', parseInt(e.target.value || '0', 10))}
              />
            </Field>
            <Field
              label="Reminder 2 — hours before appointment"
              htmlFor="reminder_2_hours"
              hint="Only fires while the 2-hour reminder above is enabled."
            >
              <input
                id="reminder_2_hours"
                type="number"
                min={1}
                className="input"
                value={settings.reminder_2_hours_before}
                onChange={(e) => patch('reminder_2_hours_before', parseInt(e.target.value || '0', 10))}
              />
            </Field>
          </div>
          <p className="text-xs text-brand-ink-400">
            Adjusting these hours does not change the wording of the Reminder templates below.
          </p>
        </div>
      </section>

      {/* Campaigns */}
      <section className="card space-y-4 p-5">
        <h2 className="text-sm font-semibold text-brand-ink-700">Campaign sending</h2>
        <p className="text-xs text-brand-ink-400">
          Campaigns send gradually rather than all at once — these defaults apply unless a campaign
          sets its own override. Once a day&apos;s limit is reached, sending automatically continues the
          next day.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Daily sending limit" htmlFor="campaign_daily_limit">
            <input
              id="campaign_daily_limit"
              type="number"
              min={1}
              className="input"
              value={settings.campaign_daily_limit}
              onChange={(e) => patch('campaign_daily_limit', parseInt(e.target.value || '0', 10))}
            />
          </Field>
          <Field label="Interval between messages (seconds)" htmlFor="campaign_send_interval">
            <input
              id="campaign_send_interval"
              type="number"
              min={1}
              className="input"
              value={settings.campaign_send_interval_seconds}
              onChange={(e) =>
                patch('campaign_send_interval_seconds', parseInt(e.target.value || '0', 10))
              }
            />
          </Field>
        </div>
      </section>

      <div>
        <Button onClick={saveSettings} loading={savingSettings}>
          Save settings
        </Button>
      </div>

      <DoctorsSection />
      <ServicesSection />

      {/* Templates */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-brand-ink-700">Message templates</h2>
        <p className="text-xs text-brand-ink-400">
          Placeholders like <code>{'{{patient_name}}'}</code> are replaced when sending.
        </p>
        {Object.entries(grouped).map(([key, items]) => (
          <div key={key} className="card space-y-3 p-5">
            <h3 className="text-sm font-semibold text-brand-ink-800">
              {TEMPLATE_LABEL[key] ?? key}
            </h3>
            {items.map((t) => (
              <div key={t.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase text-brand-ink-400">
                    {t.language === 'ar' ? 'Arabic' : 'English'}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => void saveTemplate(t.id)}
                    loading={savingTpl === t.id}
                  >
                    Save
                  </Button>
                </div>
                <textarea
                  dir={t.language === 'ar' ? 'rtl' : 'ltr'}
                  className="input min-h-[110px] resize-y font-mono text-xs"
                  value={bodies[t.id] ?? ''}
                  onChange={(e) => setBodies((b) => ({ ...b, [t.id]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        ))}
      </section>
    </div>
  );
}
