import React, { useState } from 'react';
import { Bell, HelpCircle, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mockNotifications = [
  {
    id: 1,
    type: 'approved',
    title: 'Application Approved',
    description: 'Your application ETH-2024-003 has been approved.',
    time: '2 hours ago',
    read: false,
  },
  {
    id: 2,
    type: 'revision',
    title: 'Revision Requested',
    description: 'Application ETH-2024-004 requires revisions.',
    time: '1 day ago',
    read: false,
  },
  {
    id: 3,
    type: 'rejected',
    title: 'Application Rejected',
    description: 'Application ETH-2024-005 has been rejected.',
    time: '3 days ago',
    read: true,
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = React.useState("Researcher");
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  React.useEffect(() => {
    const userProfile = localStorage.getItem("userProfile");
    if (userProfile) {
      try {
        const user = JSON.parse(userProfile);
        if (user.name) {
          setUserName(user.name);
        }
      } catch (e) {
        console.error("Failed to parse user profile", e);
      }
    }
  }, []);

  const handleStartApplication = () => {
    navigate('/new-application');
  };

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'revision':
        return <MessageSquare className="w-5 h-5 text-orange-600" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-secondary/30">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 py-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="p-2 hover:bg-accent rounded-lg transition-colors" />
                <h1 className="text-base font-normal text-foreground hidden sm:block">
                  Final International University Ethic committee
                </h1>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2 hover:bg-accent rounded-lg transition-colors">
                    <Bell className="w-6 h-6 text-foreground" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-card border border-border z-50">
                  <DropdownMenuLabel className="font-semibold">Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`flex items-start gap-3 p-3 cursor-pointer ${!notification.read ? 'bg-accent/50' : ''
                          }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="mt-0.5">{getIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {notification.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.time}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-destructive rounded-full mt-2" />
                        )}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
            <div className="bg-card rounded-lg shadow-sm border border-border p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Welcome, {userName}
              </h2>
              <p className="text-base text-muted-foreground mb-8">
                Submit and track your research ethics applications.
              </p>

              <button
                onClick={handleStartApplication}
                className="bg-destructive text-destructive-foreground text-base font-medium px-6 py-3 rounded-lg hover:bg-destructive/90 transition-colors"
              >
                Start New Application
              </button>
            </div>
          </main>

          {/* Help Button */}
          <button className="fixed bottom-8 right-8 bg-destructive text-destructive-foreground p-4 rounded-full shadow-lg hover:bg-destructive/90 transition-colors">
            <HelpCircle className="w-6 h-6" />
          </button>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
