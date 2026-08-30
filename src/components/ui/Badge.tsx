import type { ReactNode } from 'react';

type Tone = 'green' | 'gray' | 'amber' | 'sky' | 'red';

const TONE: Record<Tone, string> = {
  green: 'bg-brand-green-50 text-brand-green-700',
  gray: 'bg-brand-ink-100 text-brand-ink-600',
  amber: 'bg-amber-50 text-amber-700',
  sky: 'bg-sky-50 text-sky-700',
  red: 'bg-red-50 text-red-700',
};

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONE[tone]}`}>
      {children}
    </span>
  );
}
