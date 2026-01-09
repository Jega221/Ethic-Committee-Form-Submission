import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { FacultySidebar } from "@/components/FacultySidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, FileText, Check, X, MessageSquare, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getAllApplications, processApplication, API_BASE_URL } from "@/lib/api";
import { Loader } from "@/components/ui/loader";
import { DocumentViewer } from "@/components/DocumentViewer";

interface StudentSubmission {
  id: string;
  name: string;
  initials: string;
  program: string;
  studentId: string;
  email: string;
  pendingCount: number;
  latestSubmission: string;
  submissionDate: string;
  status: string;
  currentStep?: string;
  documents: { name: string; type: string; date: string; url: string }[];
}

const Faculty = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState<StudentSubmission | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRevisionDialogOpen, setIsRevisionDialogOpen] = useState(false);
  const [revisionComment, setRevisionComment] = useState("");
  const [actionStudent, setActionStudent] = useState<StudentSubmission | null>(null);
  const [viewingDocument, setViewingDocument] = useState<{ name: string; type: string; date: string; url: string } | null>(null);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<{ url: string; name: string; type: string } | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await getAllApplications();
      console.log("Raw Applications Data:", res.data); // DEBUG Log

      // Filter for applications currently at 'faculty' step
      // Also map backend data to UI model
      if (!Array.isArray(res.data)) {
        console.error("API response is not an array:", res.data);
        setStudents([]);
        return;
      }

      const mapped: StudentSubmission[] = res.data
        // .filter((app: any) => app.current_step === 'faculty') // Only show faculty step apps
        .map((app: any) => ({
          id: String(app.application_id),
          name: `${app.researcher_name} ${app.researcher_surname}`,
          initials: `${app.researcher_name?.[0] || ''}${app.researcher_surname?.[0] || ''}`,
          program: app.faculty_name || "Unknown Program",
          studentId: `APP-${app.application_id}`,
          email: app.email,
          pendingCount: 1, // hardcoded for now
          latestSubmission: app.title,
          submissionDate: new Date(app.submission_date).toLocaleDateString(),
          status: app.status,
          currentStep: app.current_step,
          documents: (app.documents || []).map((doc: any) => ({
            name: doc.file_name,
            type: doc.file_type,
            date: new Date(app.submission_date).toLocaleDateString(),
            url: doc.file_url // Use real URL if needed
          }))
        }));

      console.log("Mapped Students:", mapped); // DEBUG Log
      setStudents(mapped);
    } catch (error) {
      console.error("Failed to fetch applications", error);
      toast({
        title: "Error",
        description: "Failed to load applications.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleViewDocuments = (student: StudentSubmission) => {
    setSelectedStudent(student);
    setIsDialogOpen(true);
  };

  const handleApprove = async (student: StudentSubmission) => {
    try {
      await processApplication(student.id, 'approve');
      toast({
        title: "Application Approved",
        description: `${student.name}'s submission has been approved.`,
      });
      fetchApplications(); // Refresh list
    } catch (error: any) {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to approve application.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (student: StudentSubmission) => {
    try {
      await processApplication(student.id, 'rejected'); // API check: expects 'rejected'?
      toast({
        title: "Application Rejected",
        description: `${student.name}'s submission has been rejected.`,
        variant: "destructive",
      });
      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to reject application.",
        variant: "destructive",
      });
    }
  };

  const handleRequestRevision = (student: StudentSubmission) => {
    setActionStudent(student);
    setRevisionComment("");
    setIsRevisionDialogOpen(true);
  };

  const submitRevisionRequest = async () => {
    if (actionStudent) {
      try {
        await processApplication(actionStudent.id, 'revision', revisionComment);
        toast({
          title: "Revision Requested",
          description: `Revision request sent for ${actionStudent.name}.`,
          variant: "default" // or success style if available
        });
        setIsRevisionDialogOpen(false);
        setActionStudent(null);
        fetchApplications();
      } catch (error: any) {
        toast({
          title: "Action Failed",
          description: error.message || "Failed to request revision.",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusBadge = (status: string, step?: string) => {
    const s = (status || '').toLowerCase();

    // Status color logic similar to StudyStatus but simplified
    if (s === 'approved') return <Badge className="bg-green-100 text-green-700 border-green-300">Approved</Badge>;
    if (s === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
    if (s.includes('revision')) return <Badge className="bg-amber-100 text-amber-700 border-amber-300">Revision Requested</Badge>;

    // If pending, show the step
    return (
      <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
        <FileText className="h-3 w-3 mr-1" />
        {step ? (step.charAt(0).toUpperCase() + step.slice(1)) : 'Pending'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full bg-background">
          <FacultySidebar />
          <main className="flex-1 flex items-center justify-center">
            <Loader />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <FacultySidebar />
        <main className="flex-1 p-6 lg:p-10">
          <SidebarTrigger className="mb-4" />

          <div className="w-full max-w-7xl mx-auto">  
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Document Review Portal (Faculty)</h1>
              <p className="text-muted-foreground mt-1">Review and manage submitted documents for Faculty Review step.</p>
            </div>

            {/* Student Submissions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {students
                .filter(s => {
                  const step = String(s.currentStep || '').toLowerCase();
                  const status = String(s.status || '').toLowerCase();
                  return step === 'faculty_admin' && status === 'pending';
                })
                .length === 0 && (
                  <div className="col-span-full text-center p-8 text-muted-foreground">
                    No applications pending Faculty Review.
                  </div>
                )}

              {students
                .filter(s => {
                  const step = (s.currentStep || '').toLowerCase();
                  const status = (s.status || '').toLowerCase();
                  return step === 'faculty_admin' && status === 'pending';
                })
                .map((student) => (
                  <Card key={student.id} className="border border-border hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="h-14 w-14 bg-primary/10">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                            {student.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground truncate">{student.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{student.program}</p>
                          <p className="text-xs text-muted-foreground mt-1">ID: {student.studentId}</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(student.status, student.currentStep)}
                          <span className="text-xs text-muted-foreground">
                            {student.documents.length} document{student.documents.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-muted/50 rounded-lg mb-4">
                        <p className="text-xs text-muted-foreground">Latest submission</p>
                        <p className="text-sm font-medium truncate">{student.latestSubmission}</p>
                        <p className="text-xs text-muted-foreground">{student.submissionDate}</p>
                      </div>

                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-center"
                          onClick={() => handleViewDocuments(student)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Documents ({student.documents.length})
                        </Button>

                        {/* Only show actions if pending/active in this step */}
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleApprove(student)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-600 border-amber-300 hover:bg-amber-50"
                            onClick={() => handleRequestRevision(student)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(student)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </main>
      </div>

      {/* Documents Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Documents - {selectedStudent?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {selectedStudent?.documents.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.type} • {doc.date}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentDocument({
                        url: `${API_BASE_URL}/${doc.url}`,
                        name: doc.name,
                        type: doc.type
                      });
                      setDocumentViewerOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Open
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `${API_BASE_URL}/${doc.url}`;
                      link.download = doc.name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{viewingDocument?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 p-6 bg-muted rounded-lg min-h-[300px] flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4" />
              <p className="font-medium">{viewingDocument?.name}</p>
              <p className="text-sm mt-2">Document type: {viewingDocument?.type}</p>
              <p className="text-sm">Uploaded: {viewingDocument?.date}</p>
              <p className="text-xs mt-4">Document preview would be displayed here</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revision Request Dialog */}
      <Dialog open={isRevisionDialogOpen} onOpenChange={setIsRevisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision - {actionStudent?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Comments for revision:</label>
              <Textarea
                placeholder="Enter your comments and revision requirements..."
                value={revisionComment}
                onChange={(e) => setRevisionComment(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRevisionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitRevisionRequest} className="bg-amber-600 hover:bg-amber-700">
              Send Revision Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

export default Faculty;
