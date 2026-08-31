import { LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { profile, signOut } = useAuth();

  const initials =
    profile?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() ?? '–';

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-brand-ink-100 bg-white px-4 sm:px-6">
      <button onClick={onMenu} className="btn-ghost -ml-2 p-2 lg:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex flex-1 items-center justify-end gap-3 sm:gap-4">
        <div className="text-right leading-tight">
          <p className="max-w-[9rem] truncate text-sm font-medium text-brand-ink-800 sm:max-w-none">
            {profile?.full_name ?? 'Signed in'}
          </p>
          <p className="text-xs capitalize text-brand-green-700">{profile?.role ?? ''}</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-green-100 text-sm font-semibold text-brand-green-700">
          {initials}
        </div>
        <button
          onClick={() => void signOut()}
          className="btn-ghost p-2"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
