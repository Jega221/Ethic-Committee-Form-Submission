import React from 'react';
import { Bell, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleStartApplication = () => {
    navigate('/new-application');
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
              
              <button className="relative p-2 hover:bg-accent rounded-lg transition-colors">
                <Bell className="w-6 h-6 text-foreground" />
                <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  1
                </span>
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
            <div className="bg-card rounded-lg shadow-sm border border-border p-8">
              <h2 className="text-2xl font-semibold text-foreground mb-4">
                Welcome, Researcher
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
