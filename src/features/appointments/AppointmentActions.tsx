import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Pencil } from 'lucide-react';
import { STATUS_ACTIONS } from './status';
import type { AppointmentDetails, AppointmentStatus } from './types';

interface Props {
  appointment: AppointmentDetails;
  onEdit: (a: AppointmentDetails) => void;
  onStatus: (a: AppointmentDetails, status: AppointmentStatus) => void;
  /** When provided, the "Complete" action opens the completion flow instead. */
  onComplete?: (a: AppointmentDetails) => void;
}

const MENU_WIDTH = 176; // w-44

export function AppointmentActions({ appointment, onEdit, onStatus, onComplete }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const actions = STATUS_ACTIONS[appointment.status];

  // Position the portal menu under the trigger (fixed, so no ancestor clipping).
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: Math.max(8, r.right - MENU_WIDTH) });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <div className="flex justify-end">
      <button
        ref={btnRef}
        className="btn-ghost p-1.5"
        onClick={() => setOpen((o) => !o)}
        aria-label="Actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: MENU_WIDTH }}
            className="z-50 overflow-hidden rounded-lg border border-brand-ink-100 bg-white py-1 shadow-xl"
          >
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-brand-ink-700 hover:bg-brand-ink-50"
              onClick={() => {
                setOpen(false);
                onEdit(appointment);
              }}
            >
              <Pencil className="h-4 w-4" /> Edit
            </button>
            {actions.length > 0 && <div className="my-1 border-t border-brand-ink-50" />}
            {actions.map((a) => (
              <button
                key={a.to}
                className={`flex w-full px-3 py-2 text-left text-sm hover:bg-brand-ink-50 ${
                  a.variant === 'danger' ? 'text-red-600' : 'text-brand-ink-700'
                }`}
                onClick={() => {
                  setOpen(false);
                  if (a.to === 'completed' && onComplete) onComplete(appointment);
                  else onStatus(appointment, a.to);
                }}
              >
                {a.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
