import { NavLink } from 'react-router-dom';
import { navForRole } from '@/config/nav';
import type { Role } from '@/types';
import logo from '@/assets/logo.png';

export function Sidebar({ role }: { role: Role }) {
  const items = navForRole(role);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-brand-ink-100 bg-white">
      <div className="flex items-center gap-3 px-5 py-5">
        <img src={logo} alt="Expert Dental Center" className="h-10 w-10 object-contain" />
        <div className="leading-tight">
          <p className="text-sm font-bold text-brand-ink-800">Expert Dental</p>
          <p className="text-xs text-brand-green-700">Center CRM</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-green-50 text-brand-green-700'
                  : 'text-brand-ink-500 hover:bg-brand-ink-50 hover:text-brand-ink-800',
              ].join(' ')
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 text-xs text-brand-ink-300">v0.1.0 · MVP</div>
    </aside>
  );
}
