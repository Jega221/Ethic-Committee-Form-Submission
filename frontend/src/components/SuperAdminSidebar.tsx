import { LayoutDashboard } from 'lucide-react';
import { BaseSidebar, MenuItem } from './BaseSidebar';

const menuItems: MenuItem[] = [
  { title: 'System Portal', url: '/super-admin', icon: LayoutDashboard },
];

export function SuperAdminSidebar() {
  return <BaseSidebar menuItems={menuItems} currentRole="super-admin" />;
}
