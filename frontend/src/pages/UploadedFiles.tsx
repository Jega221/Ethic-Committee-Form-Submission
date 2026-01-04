import * as React from 'react';
import { useState, useEffect } from 'react';
import { Bell, FileText, Download, Eye } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { DocumentViewer } from '@/components/DocumentViewer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getUserNotifications, markNotificationAsRead } from '@/lib/api';

interface Document {
  type: string;
  fileName: string;
  url: string;
}

interface Application {
  id: string;
  title: string;
  submittedDate: string;
  status: string;
  documents: Document[];
}

const UploadedFiles = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<{ url: string; name: string; type: string } | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  /* API Integration */
  const [loading, setLoading] = useState(true);

  // import { getResearcherApplications } from '@/lib/api'; // Add import if not present

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        if (userProfile.id) {
          // Import dynamically or at top-level. 
          const { getResearcherApplications, API_BASE_URL } = await import('@/lib/api');
          const res = await getResearcherApplications(userProfile.id);

          // Map API response to UI model
          // Backend now returns nested documents array inside each application row
          const mappedApps = res.data.map((app: any) => ({
            id: String(app.application_id),
            title: app.title,
            submittedDate: new Date(app.submission_date || Date.now()).toLocaleDateString(),
            status: app.status,
            // Handle case where documents might be null from LEFT JOIN/json_agg
            documents: (app.documents || []).map((doc: any) => ({
              type: doc.file_type || 'Document',
              fileName: doc.file_name || 'Unknown',
              url: doc.file_url
            })).filter((d: any) => d.fileName)
          }));

          setApplications(mappedApps);

          // Fetch Notifications
          try {
            // We can use the statically imported function effectively
            const notifRes = await getUserNotifications(userProfile.id);
            const notifs = notifRes.data;
            setNotifications(notifs);
            setUnreadCount(notifs.filter((n: any) => !n.is_read).length);
          } catch (err) {
            console.error("Failed to load notifications", err);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const { API_BASE_URL } = await import('@/lib/api');
      window.open(`${API_BASE_URL}/${url}`, '_blank');
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (['approved', 'accepted'].some(k => s.includes(k))) return 'bg-success text-success-foreground border-success';
    if (['rejected', 'declined'].some(k => s.includes(k))) return 'bg-destructive text-destructive-foreground border-destructive';
    if (s.includes('pending') || s.includes('review') || s.includes('submitted')) return 'bg-amber-500 text-white border-amber-500'; // Amber for pending
    return 'bg-secondary text-secondary-foreground border-secondary';
  };

  if (loading) {
    return <Loader fullScreen />;
  }

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

              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative p-2 hover:bg-accent rounded-lg transition-colors outline-none">
                      <Bell className="w-6 h-6 text-foreground" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 p-0">
                    <DropdownMenuLabel className="p-4 border-b border-border">
                      <div className="flex items-center justify-between">
                        <span>Notifications</span>
                        <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
                      </div>
                    </DropdownMenuLabel>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notif: any) => (
                          <DropdownMenuItem
                            key={notif.id}
                            className={`p-4 border-b border-border last:border-0 cursor-pointer ${!notif.is_read ? 'bg-muted/50' : ''}`}
                            onClick={() => handleMarkAsRead(notif.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 p-1.5 rounded-full ${notif.is_read ? 'bg-slate-100' : 'bg-blue-100'}`}>
                                <Bell className={`w-3 h-3 ${notif.is_read ? 'text-slate-500' : 'text-blue-600'}`} />
                              </div>
                              <div className="flex-1 space-y-1">
                                <p className={`text-sm ${!notif.is_read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                  {notif.message}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(notif.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Uploaded Files
              </h2>
              <p className="text-base text-muted-foreground mt-1">
                View all documents uploaded for your research studies
              </p>
            </div>

            {/* Applications List */}
            <div className="space-y-6">
              {applications.length > 0 ? (
                applications.map((application) => (
                  <div
                    key={application.id}
                    className="bg-card rounded-lg shadow-sm border border-border p-6"
                  >
                    {/* Application Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {application.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {application.id} • Submitted: {application.submittedDate}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`whitespace-nowrap self-start ${getStatusColor(application.status)}`}
                      >
                        {application.status}
                      </Badge>
                    </div>

                    {/* Documents List */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Uploaded Documents:
                      </p>
                      <div className="space-y-2">
                        {application.documents.map((doc, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between py-3 px-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {doc.type}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {doc.fileName}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-4">
                              <button
                                onClick={async () => {
                                  const { API_BASE_URL } = await import('@/lib/api');
                                  setCurrentDocument({
                                    url: `${API_BASE_URL}/${doc.url}`,
                                    name: doc.fileName,
                                    type: doc.type
                                  });
                                  setDocumentViewerOpen(true);
                                }}
                                className="text-primary hover:text-primary/80 text-sm font-medium transition-colors flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </button>
                              <button
                                onClick={async () => {
                                  const { API_BASE_URL } = await import('@/lib/api');
                                  const link = document.createElement('a');
                                  link.href = `${API_BASE_URL}/${doc.url}`;
                                  link.download = doc.fileName;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                className="text-primary hover:text-primary/80 text-sm font-medium transition-colors flex items-center gap-1"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-card rounded-lg shadow-sm border border-border p-8 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No documents uploaded yet. Submit an application to see your files here.
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Document Viewer */}
      {currentDocument && (
        <DocumentViewer
          isOpen={documentViewerOpen}
          onClose={() => {
            setDocumentViewerOpen(false);
            setCurrentDocument(null);
          }}
          documentUrl={currentDocument.url}
          documentName={currentDocument.name}
          documentType={currentDocument.type}
        />
      )}
    </SidebarProvider>
  );
};

export default UploadedFiles;
