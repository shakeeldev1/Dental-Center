import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** Honest empty state — shown when there is genuinely no data (spec §25). */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-brand-ink-200 bg-white/50 px-6 py-12 text-center">
      {Icon && <Icon className="mb-3 h-10 w-10 text-brand-ink-300" />}
      <h3 className="text-sm font-semibold text-brand-ink-700">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-brand-ink-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
