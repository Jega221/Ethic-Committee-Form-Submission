import { useState } from 'react';
import { LogOut, Settings, Calendar, RefreshCw, X, LucideIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import fiuLogo from '@/assets/fiu-logo.png';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    useSidebar,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface MenuItem {
    title: string;
    url: string;
    icon: LucideIcon;
}

export interface BaseSidebarProps {
    menuItems: MenuItem[];
    currentRole: string;
    availableRoles?: { value: string; label: string }[];
}

export function BaseSidebar({
    menuItems,
    currentRole,
    availableRoles = [
        { value: 'researcher', label: 'Researcher' },
        { value: 'faculty', label: 'Faculty' },
        { value: 'committee', label: 'Committee' },
        { value: 'rector', label: 'Rector' },
        { value: 'admin', label: 'Admin' },
        { value: 'super-admin', label: 'Super Admin' },
    ]
}: BaseSidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { setOpenMobile, toggleSidebar } = useSidebar();
    const [selectedRole, setSelectedRole] = useState(currentRole);

    const handleLogout = () => {
        localStorage.clear(); // Clear all auth data
        navigate('/');
        setOpenMobile(false);
    };

    const handleNavigation = (url: string) => {
        navigate(url);
        setOpenMobile(false);
    };

    const handleRoleChange = (role: string) => {
        setSelectedRole(role);
        // Add logic to navigate based on role if needed
        if (role === 'researcher') navigate('/dashboard');
        if (role === 'faculty') navigate('/faculty');
        if (role === 'committee') navigate('/committee');
        if (role === 'rector') navigate('/rector');
        if (role === 'admin') navigate('/admin');
        if (role === 'super-admin') navigate('/super-admin');
        setOpenMobile(false);
    };

    return (
        <Sidebar className="border-r border-border bg-card">
            <SidebarHeader className="p-4 pb-6">
                <div className="flex justify-end mb-2">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>
                <div className="flex justify-center mb-6">
                    <img
                        src={fiuLogo}
                        alt="Final International University Logo"
                        className="h-28 w-auto object-contain"
                    />
                </div>

                <Separator className="mb-6 opacity-50" />

                {/* Quick Actions */}
                <div className="flex gap-4 justify-center mb-6">
                    <button
                        onClick={() => handleNavigation('/settings')}
                        className={`p-3 hover:bg-accent rounded-lg transition-all ${location.pathname === '/settings' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:scale-105'}`}
                        title="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleNavigation('/agenda')}
                        className={`p-3 hover:bg-accent rounded-lg transition-all ${location.pathname === '/agenda' ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:scale-105'}`}
                        title="Agenda"
                    >
                        <Calendar className="w-5 h-5" />
                    </button>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-3">
                <SidebarMenu className="gap-1">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.url;
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    onClick={() => handleNavigation(item.url)}
                                    className={`w-full justify-start gap-4 px-4 py-6 rounded-xl transition-all duration-200 ${isActive
                                            ? 'bg-destructive/10 text-destructive font-bold shadow-sm border border-destructive/20'
                                            : 'hover:bg-accent/50 text-slate-600 hover:translate-x-1'
                                        }`}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-destructive' : 'text-slate-400'}`} />
                                    <span className="text-sm">{item.title}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>

                <Separator className="my-6 opacity-50" />

                {/* Switch Role */}
                <div className="px-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <RefreshCw className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Switch Role</span>
                    </div>
                    <Select value={selectedRole} onValueChange={handleRoleChange}>
                        <SelectTrigger className="w-full bg-white/50 backdrop-blur-sm border-border hover:border-slate-300 transition-colors rounded-lg h-10">
                            <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-border z-[100] rounded-xl shadow-xl">
                            {availableRoles.map(r => (
                                <SelectItem key={r.value} value={r.value} className="focus:bg-slate-50 focus:text-destructive">
                                    {r.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Separator className="my-6 opacity-50" />

                {/* Logout Button */}
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleLogout}
                            className="w-full justify-start gap-4 px-4 py-6 hover:bg-destructive/10 hover:text-destructive transition-all rounded-xl group"
                        >
                            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-destructive" />
                            <span className="font-semibold text-sm">Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    );
}
