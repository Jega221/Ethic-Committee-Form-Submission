import { ClipboardList } from 'lucide-react';
import { BaseSidebar, MenuItem } from './BaseSidebar';

const menuItems: MenuItem[] = [
    { title: 'Home page', url: '/committee', icon: ClipboardList },
];

export function CommitteeSidebar() {
    return <BaseSidebar menuItems={menuItems} currentRole="committee_member" />;
}
