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
    availableRoles
}: BaseSidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { setOpenMobile, toggleSidebar } = useSidebar();
    // Read user profile from localStorage to support runtime role switching
    const rawProfile = typeof window !== 'undefined' ? localStorage.getItem('userProfile') : null;
    const parsedProfile = rawProfile ? JSON.parse(rawProfile) : null;

    const normalizeRole = (r: any) => {
        if (r === null || r === undefined) return '';
        return String(r).toLowerCase().replace(/[- ]+/g, '_').trim();
    };

    const canonicalRole = (r: string) => {
        const s = normalizeRole(r);
        if (!s) return s;
        if (s.includes('super')) return 'super_admin';
        if (s.includes('faculty')) return 'faculty_admin';
        if (s.includes('committee')) return 'committee_member';
        if (s.includes('rector')) return 'rector';
        if (s.includes('admin')) return 'admin';
        if (s.includes('research')) return 'researcher';
        return s;
    };

    const displayRoleLabel = (r: string) => {
        if (!r) return '';
        const cleaned = String(r).replace(/[_-]/g, ' ').trim();
        return cleaned.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    };

    // Build visible roles list: prefer roles from userProfile if present, otherwise fall back to prop/default
    const rolesFromProfile: { value: string; label: string }[] = Array.isArray(parsedProfile?.roles)
        ? parsedProfile.roles.map((r: any) => ({ value: normalizeRole(r), label: displayRoleLabel(String(r)) }))
        : [];

    const defaultRoles = [
        { value: 'researcher', label: 'Researcher' },
        { value: 'faculty_admin', label: 'Faculty' },
        { value: 'committee_member', label: 'Committee' },
        { value: 'rector', label: 'Rector' },
        { value: 'admin', label: 'Admin' },
        { value: 'super_admin', label: 'Super Admin' },
    ];

    const visibleRoles = (rolesFromProfile.length > 0) ? rolesFromProfile : (availableRoles && availableRoles.length > 0 ? availableRoles.map(r => ({ value: normalizeRole(r.value), label: r.label })) : defaultRoles);

    // Determine initial role from URL first, then profile/prop/default
    const getRoleFromUrl = (path: string) => {
        if (path.startsWith('/faculty')) return 'faculty_admin';
        if (path.startsWith('/committee')) return 'committee_member';
        if (path.startsWith('/rector')) return 'rector';
        if (path.startsWith('/admin')) return 'admin';
        if (path.startsWith('/super-admin')) return 'super_admin';
        return null;
    };

    const urlRole = getRoleFromUrl(location.pathname);
    const rawInitial = urlRole || (parsedProfile?.role ? normalizeRole(parsedProfile.role) : (currentRole ? normalizeRole(currentRole) : (visibleRoles[0]?.value || 'researcher')));
    const initialRole = canonicalRole(rawInitial);
    const [selectedRole, setSelectedRole] = useState<string>(initialRole);

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
        const normalized = normalizeRole(role);
        const canon = canonicalRole(normalized);
        setSelectedRole(canon);

        // Persist active role to localStorage so ProtectedRoute and other UI read the active role
        try {
            const rp = typeof window !== 'undefined' ? localStorage.getItem('userProfile') : null;
            if (rp) {
                const prof = JSON.parse(rp);
                prof.role = canon;
                localStorage.setItem('userProfile', JSON.stringify(prof));
            }
        } catch (e) {
            // ignore
        }

        // Role -> route mapping
        const roleRouteMap: Record<string, string> = {
            researcher: '/dashboard',
            faculty_admin: '/faculty',
            committee_member: '/committee',
            rector: '/rector',
            admin: '/admin',
            super_admin: '/super-admin'
        };

        const target = roleRouteMap[canon] || (visibleRoles[0] ? visibleRoles[0].value : '/dashboard');

        // Use replace so switching roles doesn't create back/forward noise
        navigate(target, { replace: true });
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

                {/* Quick Actions - Hide for Admin and Super Admin */}
                {!['admin', 'super_admin'].includes(selectedRole) && (
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
                )}
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
                            {visibleRoles.map(r => (
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
