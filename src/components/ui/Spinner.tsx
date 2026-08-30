import { Loader2 } from 'lucide-react';

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-brand-green-500 ${className}`} aria-label="Loading" />;
}

export function FullPageSpinner() {
  return (
    <div className="flex h-full min-h-screen w-full items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
