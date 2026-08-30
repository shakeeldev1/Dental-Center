import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  MessageCircle,
  Megaphone,
  Settings,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/types';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: Role[];
}

/**
 * Main navigation (spec §5). Items are filtered by the current user's role:
 * receptionists see the clinical workflow; admins additionally see Campaigns,
 * Settings and Users.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'receptionist'] },
  { label: 'Patients', path: '/patients', icon: Users, roles: ['admin', 'receptionist'] },
  { label: 'Appointments', path: '/appointments', icon: CalendarDays, roles: ['admin', 'receptionist'] },
  { label: 'Treatments', path: '/treatments', icon: Stethoscope, roles: ['admin', 'receptionist'] },
  { label: 'Campaigns', path: '/campaigns', icon: Megaphone, roles: ['admin'] },
  { label: 'WhatsApp', path: '/whatsapp', icon: MessageCircle, roles: ['admin', 'receptionist'] },
  { label: 'Settings', path: '/settings', icon: Settings, roles: ['admin'] },
  { label: 'Users', path: '/users', icon: UserCog, roles: ['admin'] },
];

export function navForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
