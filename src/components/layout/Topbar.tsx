import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Topbar() {
  const { profile, signOut } = useAuth();

  const initials =
    profile?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '–';

  return (
    <header className="flex h-16 items-center justify-between border-b border-brand-ink-100 bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right leading-tight">
          <p className="text-sm font-medium text-brand-ink-800">{profile?.full_name ?? 'Signed in'}</p>
          <p className="text-xs capitalize text-brand-green-700">{profile?.role ?? ''}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-green-100 text-sm font-semibold text-brand-green-700">
          {initials}
        </div>
        <button
          onClick={() => void signOut()}
          className="btn-ghost"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
