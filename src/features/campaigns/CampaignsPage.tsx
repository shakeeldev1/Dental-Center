import { useCallback, useEffect, useRef, useState } from 'react';
import { Megaphone, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/format';
import { listCampaigns, audienceCount, sendCampaign } from './api';
import { CampaignForm } from './CampaignForm';
import { AUDIENCE_LABEL, CAMPAIGN_STATUS_TONE, type Campaign } from './types';

export function CampaignsPage() {
  const toast = useToast();
  const [rows, setRows] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [sendTarget, setSendTarget] = useState<Campaign | null>(null);
  const [sendCount, setSendCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await listCampaigns());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load campaigns.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  // Poll while any campaign is actively sending.
  useEffect(() => {
    const active = rows.some((c) => c.status === 'sending');
    if (active && !pollRef.current) {
      pollRef.current = setInterval(() => void load(), 3000);
    } else if (!active && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [rows, load]);

  async function openSend(c: Campaign) {
    setSendTarget(c);
    setSendCount(null);
    try {
      setSendCount(await audienceCount(c.audience_type));
    } catch {
      setSendCount(null);
    }
  }

  async function confirmSend() {
    if (!sendTarget) return;
    setSending(true);
    try {
      await sendCampaign(sendTarget.id);
      toast.success('Campaign sending started.');
      setSendTarget(null);
      void load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not start campaign.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink-800">Campaigns</h1>
          <p className="text-sm text-brand-ink-400">Promotional WhatsApp campaigns</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Megaphone className="h-4 w-4" />
          New campaign
        </Button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-7 w-7" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Megaphone}
              title="No campaigns yet."
              description="Create a campaign to send a WhatsApp offer to your patients."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-brand-ink-100 text-xs uppercase tracking-wide text-brand-ink-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Campaign</th>
                  <th className="px-4 py-3 font-medium">Audience</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-ink-50">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-brand-ink-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-ink-800">{c.name}</p>
                      {c.offer && <p className="text-xs text-brand-ink-400">{c.offer}</p>}
                      <p className="text-xs text-brand-ink-300">{formatDate(c.created_at)}</p>
                    </td>
                    <td className="px-4 py-3 text-brand-ink-600">{AUDIENCE_LABEL[c.audience_type]}</td>
                    <td className="px-4 py-3">
                      <Badge tone={CAMPAIGN_STATUS_TONE[c.status]}>{c.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-brand-ink-600">
                      {c.status === 'draft' ? (
                        '—'
                      ) : (
                        <span>
                          {c.sent_count}/{c.total_recipients} sent
                          {c.failed_count > 0 && (
                            <span className="text-red-600"> · {c.failed_count} failed</span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.status === 'draft' && (
                        <Button variant="secondary" onClick={() => void openSend(c)}>
                          <Send className="h-4 w-4" /> Send
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CampaignForm open={formOpen} onClose={() => setFormOpen(false)} onCreated={() => void load()} />

      <Modal
        open={Boolean(sendTarget)}
        onClose={() => setSendTarget(null)}
        title="Send campaign"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSendTarget(null)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={confirmSend} loading={sending} disabled={sendCount === 0}>
              Send now
            </Button>
          </>
        }
      >
        {sendTarget && (
          <p className="text-sm text-brand-ink-600">
            Send <span className="font-medium text-brand-ink-800">{sendTarget.name}</span> to{' '}
            <span className="font-medium text-brand-ink-800">
              {sendCount === null ? '…' : sendCount}
            </span>{' '}
            recipient{sendCount === 1 ? '' : 's'} ({AUDIENCE_LABEL[sendTarget.audience_type]}) over
            WhatsApp? Only send to patients who have opted in to receive messages.
          </p>
        )}
      </Modal>
    </div>
  );
}
