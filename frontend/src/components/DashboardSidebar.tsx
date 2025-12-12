import { Home, FileUp, BarChart3, RefreshCw, LogOut, Settings, Calendar, X } from 'lucide-react';
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

const menuItems = [
  { title: 'Home page', url: '/dashboard', icon: Home },
  { title: 'Uploaded files', url: '/uploaded-files', icon: FileUp },
  { title: 'Study Status', url: '/study-status', icon: BarChart3 },
  { title: 'Switch Accounts', url: '/switch-accounts', icon: RefreshCw },
];

export function DashboardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setOpenMobile, toggleSidebar } = useSidebar();

  const handleLogout = () => {
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
        <div className="flex items-center justify-between mb-6">
          <img
            src={fiuLogo}
            alt="Final International University Logo"
            className="h-40 w-auto object-contain mx-auto"
          />
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <Separator className="mb-6" />

        {/* Quick Actions */}
        <div className="flex gap-4 justify-center mb-6">
          <button
            onClick={() => navigate('/settings')}
            className="p-3 hover:bg-accent rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => navigate('/agenda')}
            className="p-3 hover:bg-accent rounded-lg transition-colors"
          >
            <Calendar className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
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
