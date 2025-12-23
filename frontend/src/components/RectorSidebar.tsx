import { useState } from 'react';
import { Home, RefreshCw, LogOut, X } from 'lucide-react';
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

const menuItems = [
    { title: 'Home page', url: '/rector', icon: Home },
];

export function RectorSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setOpenMobile, toggleSidebar } = useSidebar();
    const [selectedRole, setSelectedRole] = useState('rector');

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userProfile");
        navigate('/');
        setOpenMobile(false);
    };

    const handleNavigation = (url: string) => {
        navigate(url);
        setOpenMobile(false);
    };

    return (
        <Sidebar className="border-r border-border">
            <SidebarHeader className="p-4 pb-6">
                <div className="flex justify-end mb-2">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex justify-center mb-6">
                    <img
                        src={fiuLogo}
                        alt="Final International University Logo"
                        className="h-28 w-auto object-contain"
                    />
                </div>

                <Separator className="mb-6" />
            </SidebarHeader>

            <SidebarContent className="px-3">
                <SidebarMenu>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.url;
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    onClick={() => handleNavigation(item.url)}
                                    className={`w-full justify-start gap-3 px-4 py-3 ${isActive ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.title}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>

                <Separator className="my-6" />

                {/* Switch Role */}
                <div className="px-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <RefreshCw className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Switch Role</span>
                    </div>
                    <Select value={selectedRole} onValueChange={(val) => {
                        setSelectedRole(val);
                        if (val === 'researcher') navigate('/dashboard');
                        if (val === 'faculty') navigate('/faculty');
                        if (val === 'committee') navigate('/committee');
                    }}>
                        <SelectTrigger className="w-full bg-background border-border">
                            <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border z-50">
                            <SelectItem value="researcher">Researcher</SelectItem>
                            <SelectItem value="faculty">Faculty</SelectItem>
                            <SelectItem value="committee">Committee</SelectItem>
                            <SelectItem value="rector">Rector</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Separator className="my-6" />

                {/* Logout Button */}
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleLogout}
                            className="w-full justify-start gap-3 px-4 py-3 hover:bg-destructive/10 hover:text-destructive"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    );
}
