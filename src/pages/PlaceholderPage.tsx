import { Construction } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * Temporary page for sections that are scaffolded but built in a later phase.
 * Replaced by the real feature page as each phase lands.
 */
export function PlaceholderPage({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-ink-800">{title}</h1>
      <EmptyState
        icon={Construction}
        title={`${title} is coming up`}
        description={`This section will be implemented in ${phase} of the build.`}
      />
    </div>
  );
}
