import { Home, FileUp, BarChart3 } from 'lucide-react';
import { BaseSidebar, MenuItem } from './BaseSidebar';

const menuItems: MenuItem[] = [
  { title: 'Home page', url: '/dashboard', icon: Home },
  { title: 'Uploaded files', url: '/uploaded-files', icon: FileUp },
  { title: 'Study Status', url: '/study-status', icon: BarChart3 },
];

export function DashboardSidebar() {
  return <BaseSidebar menuItems={menuItems} currentRole="researcher" />;
}
