import { Home } from 'lucide-react';
import { BaseSidebar, MenuItem } from './BaseSidebar';

const menuItems: MenuItem[] = [
    { title: 'Home page', url: '/rector', icon: Home },
];

export function RectorSidebar() {
    return <BaseSidebar menuItems={menuItems} currentRole="rector" />;
}
