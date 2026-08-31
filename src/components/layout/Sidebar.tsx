import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { navForRole } from '@/config/nav';
import type { Role } from '@/types';
import logo from '@/assets/logo.png';

interface SidebarProps {
  role: Role;
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ role, open, onClose }: SidebarProps) {
  const items = navForRole(role);

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-brand-ink-100 bg-white',
        'transform transition-transform duration-200 ease-in-out',
        'lg:static lg:z-auto lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Expert Dental Center" className="h-10 w-10 object-contain" />
          <div className="leading-tight">
            <p className="text-sm font-bold text-brand-ink-800">Expert Dental</p>
            <p className="text-xs text-brand-green-700">Center CRM</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="btn-ghost -mr-2 p-1 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-green-50 text-brand-green-700'
                  : 'text-brand-ink-500 hover:bg-brand-ink-50 hover:text-brand-ink-800',
              ].join(' ')
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 text-xs text-brand-ink-300">v0.1.0 · MVP</div>
    </aside>
  );
}
