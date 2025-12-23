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

interface SubmittedApplication {
  id: string;
  title: string;
  submissionDate: string;
  status: string;
  documents: { type: string; fileName: string }[];
  // Extended fields from form
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
  if (status.includes('Faculty')) return 1;
  if (status.includes('Committee') || status.includes('Ethics')) return 2;
  if (status.includes('Dean')) return 3;
  if (status.includes('Approved') || status.includes('Final')) return 4;
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

  useEffect(() => {
    const saved = localStorage.getItem('submittedApplications');
    if (saved) {
      setApplications(JSON.parse(saved));
    }
  }, []);

  const latestApplication = applications[applications.length - 1];
  const currentStatusIndex = latestApplication ? getStatusIndex(latestApplication.status) : 0;

  // Get user profile for additional info
  const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');

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

            {latestApplication ? (
              <>
                {/* Success Alert */}
                <Card className="mb-6 border-success/30 bg-success/5">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="p-2 rounded-full bg-success/10">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <span className="text-foreground font-medium">Success: Your application has been submitted successfully.</span>
                  </CardContent>
                </Card>

                {/* Submission Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Submission ID</p>
                      <p className="text-foreground text-lg font-semibold font-mono">{latestApplication.id}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Research Title</p>
                      <p className="text-foreground text-lg font-semibold">{latestApplication.title || 'Untitled Research'}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Uploaded Files */}
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
                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">No documents uploaded</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Status Badge */}
                <div className="flex justify-center mb-6">
                  <span className="px-6 py-2.5 bg-destructive text-destructive-foreground rounded-full text-sm font-semibold shadow-md">
                    {latestApplication.status}
                  </span>
                </div>

                {/* Progress Steps */}
                <Card className="mb-8 border-border/50 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between relative">
                      {/* Connecting Line - Background */}
                      <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-muted rounded-full" />
                      {/* Connecting Line - Progress (green for completed) */}
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

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-success/10 rounded-lg">
                          <Calendar className="w-5 h-5 text-success" />
                        </div>
                        <h3 className="text-foreground font-semibold">Submitted</h3>
                      </div>
                      <p className="text-muted-foreground text-sm">{latestApplication.submissionDate}</p>
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

                {/* Action Button */}
                <div className="flex justify-center">
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

                {/* View Submission Modal */}
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
                        {/* Header Info */}
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase">Reference Number</p>
                            <p className="text-lg font-mono font-semibold text-foreground">{latestApplication.id}</p>
                          </div>
                          <span className="px-4 py-1.5 bg-destructive text-destructive-foreground rounded-full text-sm font-medium">
                            {latestApplication.status}
                          </span>
                        </div>

                        {/* Applicant Information */}
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

                        {/* Research Information */}
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

                        {/* Participants */}
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

                        {/* Ethics & Data Protection */}
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

                        {/* Documents */}
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
                                  <Button variant="ghost" size="sm" className="text-primary">
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
