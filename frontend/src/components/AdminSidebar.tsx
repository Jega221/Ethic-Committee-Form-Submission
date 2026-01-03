import { Users, ClipboardList } from 'lucide-react';
import { BaseSidebar, MenuItem } from './BaseSidebar';

const menuItems: MenuItem[] = [
  { title: 'User Management', url: '/admin', icon: Users },
  { title: 'Review Oversight', url: '/admin/review-oversight', icon: ClipboardList },
];

export function AdminSidebar() {
  // Derive current role from localStorage userProfile if available
  let currentRole = 'admin';
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('userProfile') : null;
    if (raw) {
      const p = JSON.parse(raw);
      if (p && p.role) currentRole = p.role;
      else if (p && Array.isArray(p.roles) && p.roles.length > 0) currentRole = p.roles[0];
    }
  } catch (e) {
    // fallback to admin
  }

  return <BaseSidebar menuItems={menuItems} currentRole={currentRole} />;
}
