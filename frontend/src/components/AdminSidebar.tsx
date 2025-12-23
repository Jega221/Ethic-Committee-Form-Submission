import { Users, ClipboardList } from 'lucide-react';
import { BaseSidebar, MenuItem } from './BaseSidebar';

const menuItems: MenuItem[] = [
  { title: 'User Management', url: '/admin', icon: Users },
  { title: 'Review Oversight', url: '/admin/review-oversight', icon: ClipboardList },
];

export function AdminSidebar() {
  return <BaseSidebar menuItems={menuItems} currentRole="admin" />;
}
