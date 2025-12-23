import * as React from 'react';
import { useState, useEffect } from 'react';
import { Bell, FileText, Download, Eye } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';

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
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

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
                                onClick={() => handleDownload(doc.url)}
                                className="text-primary hover:text-primary/80 text-sm font-medium transition-colors flex items-center gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </button>
                              <button
                                onClick={() => handleDownload(doc.url)}
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
    </SidebarProvider>
  );
};

export default UploadedFiles;
