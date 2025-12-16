import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, ClipboardList, LogOut } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import fiuLogo from '@/assets/fiu-logo.png';

const menuItems = [
  { title: 'User Management', url: '/admin', icon: Users },
  { title: 'Review Oversight', url: '/admin/review-oversight', icon: ClipboardList },
];

export function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setOpenMobile } = useSidebar();

  const handleLogout = () => {
    setOpenMobile(false);
    navigate('/');
  };

  const handleNavigation = (url: string) => {
    setOpenMobile(false);
    navigate(url);
  };

  const isActive = (url: string) => location.pathname === url;

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <img src={fiuLogo} alt="FIU Logo" className="h-12 w-auto" />
          <div className="text-right">
            <span className="text-sm font-semibold text-foreground block">Admin</span>
            <span className="text-sm font-semibold text-foreground block">Panel</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                onClick={() => handleNavigation(item.url)}
                className={`w-full justify-start gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.url)
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'text-foreground hover:bg-accent'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="w-full justify-start gap-3 px-4 py-3 text-primary hover:bg-accent rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
