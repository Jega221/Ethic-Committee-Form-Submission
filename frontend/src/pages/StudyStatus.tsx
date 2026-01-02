import { CheckCircle, FileText, Download, Calendar, MessageSquare, Eye, User, BookOpen, Users, Shield } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { getResearcherApplications, API_BASE_URL } from '@/lib/api';

interface Document {
  type: string;
  fileName: string;
  fileData?: string;
  fileType?: string;
}

interface SubmittedApplication {
  id: string;
  title: string;
  submissionDate: string;
  status: string;
  documents: Document[];
  applicantName?: string;
  email?: string;
  faculty?: string;
  researchType?: string;
  startDate?: string;
  endDate?: string;
  fundingSource?: string;
  participantCount?: string;
  vulnerablePopulations?: string;
  riskLevel?: string;
  dataProtection?: string;
}

const statusSteps = [
  { key: 'submitted', label: 'Submitted', color: 'bg-success' },
  { key: 'faculty', label: 'Faculty Review', color: 'bg-info' },
  { key: 'committee', label: 'Committee Review', color: 'bg-warning' },
  { key: 'dean', label: 'Dean Decision', color: 'bg-primary' },
];

const getStatusIndex = (status: string): number => {
  const s = (status || '').toLowerCase();
  if (s.includes('faculty')) return 1;
  if (s.includes('committee') || s.includes('ethics')) return 2;
  if (s.includes('dean')) return 3;
  if (s.includes('approved') || s.includes('final')) return 4;
  return 0;
};

const getExpectedDecisionDate = (submissionDate: string): string => {
  const date = new Date(submissionDate);
  date.setDate(date.getDate() + 30);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export default function StudyStatus() {
  const [applications, setApplications] = useState<SubmittedApplication[]>([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Try backend first, fall back to localStorage
      try {
        const profileStr = localStorage.getItem('userProfile');
        if (!profileStr) {
          // load from localStorage only
          const saved = localStorage.getItem('submittedApplications');
          if (saved) setApplications(JSON.parse(saved));
          setLoading(false);
          return;
        }

        const user = JSON.parse(profileStr);
        if (!user?.id) {
          const saved = localStorage.getItem('submittedApplications');
          if (saved) setApplications(JSON.parse(saved));
          setLoading(false);
          return;
        }

        const res = await getResearcherApplications(user.id);
        const mapped = (res.data || []).map((app: any) => {
          const docs = (app.documents || []).map((d: any) => {
            const url = d.file_url || d.url || d.path || null;
            const fileData = url ? `${API_BASE_URL}/${url}` : undefined;
            return {
              type: d.file_type || d.type || 'Document',
              fileName: d.file_name || d.name || 'Document',
              fileData,
              fileType: d.mime_type || d.file_mime || undefined,
            } as Document;
          });

          return {
            id: String(app.application_id || app.id || ''),
            title: app.title || app.research_title || 'Untitled Research',
            submissionDate: app.submission_date || app.created_at || new Date().toISOString(),
            status: app.status || app.current_step || 'Submitted',
            documents: docs,
            applicantName: `${app.first_name || app.name || ''} ${app.surname || ''}`.trim(),
            email: app.email,
            faculty: app.faculty_name || app.faculty,
            researchType: app.research_type,
            startDate: app.start_date,
            endDate: app.end_date,
            fundingSource: app.funding_source,
            participantCount: app.participant_count,
            vulnerablePopulations: app.vulnerable_populations,
            riskLevel: app.risk_level,
            dataProtection: app.data_protection,
          } as SubmittedApplication;
        });

        setApplications(mapped);
        // persist a client-side copy for offline/viewing older submissions
        try { localStorage.setItem('submittedApplications', JSON.stringify(mapped)); } catch {}
      } catch (err) {
        // fall back to localStorage
        const saved = localStorage.getItem('submittedApplications');
        if (saved) setApplications(JSON.parse(saved));
        console.error('Failed to load applications from backend', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // show file in-app (same window) using modal viewer
  const handleViewDocument = (doc: Document) => {
    if (doc.fileData) {
      setCurrentDoc(doc);
      setIsDocModalOpen(true);
    } else {
      // eslint-disable-next-line no-alert
      alert('File data not available. This submission was made before file storage was enabled. Please submit a new application.');
    }
  };

  const handleDownloadDocument = (doc: Document) => {
    if (doc.fileData) {
      const link = document.createElement('a');
      link.href = doc.fileData;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // eslint-disable-next-line no-alert
      alert('File data not available. This submission was made before file storage was enabled. Please submit a new application.');
    }
  };

  const clearOldSubmissions = () => {
    localStorage.removeItem('submittedApplications');
    setApplications([]);
  };

  const latestApplication = applications[applications.length - 1];
  const currentStatusIndex = latestApplication ? getStatusIndex(latestApplication.status) : 0;

  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');

  // helper to pick badge classes for status
  const getStatusBadgeClass = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('approved') || s.includes('final')) {
      return 'px-6 py-2.5 bg-success text-success-foreground rounded-full text-sm font-semibold shadow-md';
    }
    if (s.includes('reject') || s.includes('rejected')) {
      return 'px-6 py-2.5 bg-destructive text-destructive-foreground rounded-full text-sm font-semibold shadow-md';
    }
    // treat submitted/faculty/committee/pending as pending (orange)
    if (s.includes('pending') || s.includes('submitted') || s.includes('faculty') || s.includes('committee') || s.includes('ethics')) {
      return 'px-6 py-2.5 bg-warning text-warning-foreground rounded-full text-sm font-semibold shadow-md';
    }
    return 'px-6 py-2.5 bg-muted text-muted-foreground rounded-full text-sm font-semibold shadow-md';
  };

  // smaller pill used inside dialog/modal
  const getStatusPillClass = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('approved') || s.includes('final')) {
      return 'px-4 py-1.5 bg-success text-success-foreground rounded-full text-sm font-medium';
    }
    if (s.includes('reject') || s.includes('rejected')) {
      return 'px-4 py-1.5 bg-destructive text-destructive-foreground rounded-full text-sm font-medium';
    }
    if (s.includes('pending') || s.includes('submitted') || s.includes('faculty') || s.includes('committee') || s.includes('ethics')) {
      return 'px-4 py-1.5 bg-warning text-warning-foreground rounded-full text-sm font-medium';
    }
    return 'px-4 py-1.5 bg-muted text-muted-foreground rounded-full text-sm font-medium';
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-6 md:p-8">
          <SidebarTrigger className="mb-6" />

          <div className="max-w-5xl">
            <h1 className="text-foreground text-lg font-semibold tracking-wide uppercase mb-6">
              Submission Status
            </h1>

            {loading ? (
              <Card className="border-border/50">
                <CardContent className="text-center py-16">
                  <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-foreground font-semibold text-lg mb-2">Loading submissions...</h3>
                </CardContent>
              </Card>
            ) : latestApplication ? (
              <>
                <Card className="mb-6 border-success/30 bg-success/5">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="p-2 rounded-full bg-success/10">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <span className="text-foreground font-medium">Success: Your application has been submitted successfully.</span>
                  </CardContent>
                </Card>

                <div className="mb-8">
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Research Title</p>
                      <p className="text-foreground text-lg font-semibold">{latestApplication.title || 'Untitled Research'}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-center mb-6">
                  <span className={getStatusBadgeClass(latestApplication.status)}>
                    {latestApplication.status}
                  </span>
                </div>

                <Card className="mb-8 border-border/50 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-muted rounded-full" />
                      <div
                        className="absolute top-5 left-[10%] h-1 bg-success rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(currentStatusIndex * 26.67, 80)}%` }}
                      />
                      {statusSteps.map((step, index) => (
                        <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
                          <div
                            className={`w-10 h-10 rounded-full border-3 flex items-center justify-center transition-all duration-300 ${
                              index < currentStatusIndex
                                ? 'bg-success border-success text-success-foreground'
                                : index === currentStatusIndex
                                ? 'bg-destructive border-destructive text-destructive-foreground ring-4 ring-destructive/20'
                                : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                            }`}
                          >
                            {index < currentStatusIndex ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <span className="text-sm font-semibold">{index + 1}</span>
                            )}
                          </div>
                          <span className={`text-xs mt-3 text-center font-medium ${
                            index < currentStatusIndex 
                              ? 'text-success' 
                              : index === currentStatusIndex 
                              ? 'text-destructive' 
                              : 'text-muted-foreground'
                          }`}>
                            {step.label}
                          </span>
                          {index === currentStatusIndex && (
                            <span className="text-xs text-destructive mt-1 font-medium">Current</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-success/10 rounded-lg">
                          <Calendar className="w-5 h-5 text-success" />
                        </div>
                        <h3 className="text-foreground font-semibold">Submitted</h3>
                      </div>
                      <p className="text-muted-foreground text-sm">{new Date(latestApplication.submissionDate).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-warning/10 rounded-lg">
                          <Calendar className="w-5 h-5 text-warning" />
                        </div>
                        <h3 className="text-foreground font-semibold">Expected Decision</h3>
                      </div>
                      <p className="text-muted-foreground text-sm">{getExpectedDecisionDate(latestApplication.submissionDate)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-info/10 rounded-lg">
                          <MessageSquare className="w-5 h-5 text-info" />
                        </div>
                        <h3 className="text-foreground font-semibold">Messages / Notes</h3>
                      </div>
                      <p className="text-muted-foreground text-sm italic">No messages yet</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-center mb-8">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setIsViewModalOpen(true)}
                    className="w-full md:w-1/2 py-6 border-2 border-destructive text-destructive font-semibold hover:bg-destructive hover:text-destructive-foreground transition-all"
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    View Submission
                  </Button>
                </div>

                <Card className="mb-8 border-border/50 shadow-sm">
                  <CardContent className="p-5">
                    <h2 className="text-primary font-semibold mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Uploaded Documents
                    </h2>
                    <div className="space-y-3">
                      {latestApplication.documents.length > 0 ? (
                        latestApplication.documents.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded">
                                <FileText className="w-4 h-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-foreground font-medium text-sm">{doc.fileName}</p>
                                <p className="text-muted-foreground text-xs">{doc.type}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" onClick={() => handleViewDocument(doc)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" onClick={() => handleDownloadDocument(doc)}>
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">No documents uploaded</p>
                      )}

                      {latestApplication.documents.length > 0 && !latestApplication.documents[0]?.fileData && (
                        <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                          <p className="text-sm text-warning-foreground">
                            <strong>Note:</strong> This submission was made before file storage was enabled.
                            View/Download may not work. Please submit a new application for full functionality.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                  <DialogContent className="max-w-3xl max-h-[90vh]">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold text-destructive flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Submission Details
                      </DialogTitle>
                    </DialogHeader>

                    <ScrollArea className="max-h-[70vh] pr-4">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase">Reference Number</p>
                            <p className="text-lg font-mono font-semibold text-foreground">{latestApplication.id}</p>
                          </div>
                          <span className={getStatusPillClass(latestApplication.status)}>
                            {latestApplication.status}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            Applicant Information
                          </h3>
                          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                            <div>
                              <p className="text-xs text-muted-foreground">Full Name</p>
                              <p className="text-foreground font-medium">
                                {userProfile.firstName && userProfile.surname
                                  ? `${userProfile.firstName} ${userProfile.surname}`
                                  : latestApplication.applicantName || 'Not specified'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Email</p>
                              <p className="text-foreground font-medium">{userProfile.email || latestApplication.email || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Faculty</p>
                              <p className="text-foreground font-medium">{userProfile.faculty || latestApplication.faculty || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Submission Date</p>
                              <p className="text-foreground font-medium">{latestApplication.submissionDate}</p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary" />
                            Research Information
                          </h3>
                          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                            <div>
                              <p className="text-xs text-muted-foreground">Research Title</p>
                              <p className="text-foreground font-medium">{latestApplication.title || 'Untitled Research'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">Research Type</p>
                                <p className="text-foreground font-medium">{latestApplication.researchType || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Funding Source</p>
                                <p className="text-foreground font-medium">{latestApplication.fundingSource || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Start Date</p>
                                <p className="text-foreground font-medium">{latestApplication.startDate || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">End Date</p>
                                <p className="text-foreground font-medium">{latestApplication.endDate || 'Not specified'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            Participants
                          </h3>
                          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                            <div>
                              <p className="text-xs text-muted-foreground">Number of Participants</p>
                              <p className="text-foreground font-medium">{latestApplication.participantCount || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Vulnerable Populations</p>
                              <p className="text-foreground font-medium">{latestApplication.vulnerablePopulations || 'None'}</p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            Ethics & Data Protection
                          </h3>
                          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                            <div>
                              <p className="text-xs text-muted-foreground">Risk Level</p>
                              <p className="text-foreground font-medium">{latestApplication.riskLevel || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Data Protection Measures</p>
                              <p className="text-foreground font-medium">{latestApplication.dataProtection || 'Not specified'}</p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Uploaded Documents
                          </h3>
                          <div className="space-y-2">
                            {latestApplication.documents.length > 0 ? (
                              latestApplication.documents.map((doc, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <FileText className="w-4 h-4 text-primary" />
                                    <div>
                                      <p className="text-foreground font-medium text-sm">{doc.fileName}</p>
                                      <p className="text-muted-foreground text-xs">{doc.type}</p>
                                    </div>
                                  </div>
                                  <Button variant="ghost" size="sm" className="text-primary" onClick={() => handleDownloadDocument(doc)}>
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <p className="text-muted-foreground text-sm p-4 bg-muted/30 rounded-lg">No documents uploaded</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>

                {/* Document viewer modal (in-app) */}
                <Dialog open={isDocModalOpen} onOpenChange={setIsDocModalOpen}>
                  <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-semibold">View Document</DialogTitle>
                    </DialogHeader>
                    <div className="h-[70vh]">
                      {currentDoc?.fileType?.startsWith('image/') ? (
                        <img src={currentDoc.fileData} alt={currentDoc.fileName} className="max-h-full mx-auto" />
                      ) : currentDoc?.fileType === 'application/pdf' ? (
                        <iframe src={currentDoc.fileData} title={currentDoc.fileName} className="w-full h-full border-none" />
                      ) : currentDoc?.fileData ? (
                        <iframe src={currentDoc.fileData} title={currentDoc.fileName} className="w-full h-full border-none" />
                      ) : (
                        <div className="p-6">No preview available</div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <Card className="border-border/50">
                <CardContent className="text-center py-16">
                  <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-foreground font-semibold text-lg mb-2">No Submissions Yet</h3>
                  <p className="text-muted-foreground">Submit an application to track your study status here.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}