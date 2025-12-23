import { Home } from 'lucide-react';
import { BaseSidebar, MenuItem } from './BaseSidebar';

const menuItems: MenuItem[] = [
  { title: 'Home page', url: '/faculty', icon: Home },
];

export function FacultySidebar() {
  return <BaseSidebar menuItems={menuItems} currentRole="faculty" />;
}
