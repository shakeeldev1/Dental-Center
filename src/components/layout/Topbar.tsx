import { useEffect, useRef, useState } from 'react';
import { LogOut, Menu, KeyRound, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ChangePasswordModal } from '@/features/auth/ChangePasswordModal';

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

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

      <div className="relative flex flex-1 items-center justify-end" ref={ref}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-brand-ink-50"
        >
          <div className="text-right leading-tight">
            <p className="max-w-[9rem] truncate text-sm font-medium text-brand-ink-800 sm:max-w-none">
              {profile?.full_name ?? 'Signed in'}
            </p>
            <p className="text-xs capitalize text-brand-green-700">{profile?.role ?? ''}</p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-green-100 text-sm font-semibold text-brand-green-700">
            {initials}
          </div>
          <ChevronDown className="h-4 w-4 text-brand-ink-400" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-14 z-50 w-52 overflow-hidden rounded-lg border border-brand-ink-100 bg-white py-1 shadow-xl">
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-brand-ink-700 hover:bg-brand-ink-50"
              onClick={() => {
                setMenuOpen(false);
                setPwOpen(true);
              }}
            >
              <KeyRound className="h-4 w-4" /> Change password
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-brand-ink-700 hover:bg-brand-ink-50"
              onClick={() => {
                setMenuOpen(false);
                void signOut();
              }}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        )}
      </div>

      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </header>
  );
}
