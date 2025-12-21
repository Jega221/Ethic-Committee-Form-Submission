import { useState } from "react";
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
  status: "pending" | "approved" | "rejected" | "revision";
  documents: { name: string; type: string; date: string }[];
}

const initialStudents: StudentSubmission[] = [
  {
    id: "1",
    name: "Marhaba Bernadette",
    initials: "MB",
    program: "PhD in Computer Science",
    studentId: "ST2025001",
    email: "marhaba.b@student.fiu.edu",
    pendingCount: 4,
    latestSubmission: "Research Proposal Draft",
    submissionDate: "11/8/2025",
    status: "pending",
    documents: [
      { name: "Research Proposal Draft", type: "Proposal", date: "11/8/2025" },
      { name: "Literature Review", type: "Document", date: "11/5/2025" },
      { name: "Methodology Chapter", type: "Document", date: "11/3/2025" },
      { name: "Ethics Application", type: "Ethics", date: "11/1/2025" },
    ],
  },
  {
    id: "2",
    name: "John Smith",
    initials: "JS",
    program: "PhD in Healthcare Management",
    studentId: "ST2025002",
    email: "john.smith@student.fiu.edu",
    pendingCount: 3,
    latestSubmission: "IRB Protocol Submission",
    submissionDate: "11/5/2025",
    status: "pending",
    documents: [
      { name: "IRB Protocol Submission", type: "Ethics", date: "11/5/2025" },
      { name: "Consent Form Draft", type: "Document", date: "11/3/2025" },
      { name: "Data Collection Plan", type: "Document", date: "11/1/2025" },
    ],
  },
  {
    id: "3",
    name: "Sarah Johnson",
    initials: "SJ",
    program: "MSc in Data Science",
    studentId: "ST2025003",
    email: "sarah.j@student.fiu.edu",
    pendingCount: 2,
    latestSubmission: "Thesis Chapter 1",
    submissionDate: "11/10/2025",
    status: "pending",
    documents: [
      { name: "Thesis Chapter 1", type: "Thesis", date: "11/10/2025" },
      { name: "Research Timeline", type: "Document", date: "11/8/2025" },
    ],
  },
];

const Faculty = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentSubmission[]>(initialStudents);
  const [selectedStudent, setSelectedStudent] = useState<StudentSubmission | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRevisionDialogOpen, setIsRevisionDialogOpen] = useState(false);
  const [revisionComment, setRevisionComment] = useState("");
  const [actionStudent, setActionStudent] = useState<StudentSubmission | null>(null);
  const [viewingDocument, setViewingDocument] = useState<{ name: string; type: string; date: string } | null>(null);

  const handleViewDocuments = (student: StudentSubmission) => {
    setSelectedStudent(student);
    setIsDialogOpen(true);
  };

  const handleApprove = (student: StudentSubmission) => {
    setStudents(prev => prev.map(s => 
      s.id === student.id ? { ...s, status: "approved" as const, pendingCount: 0 } : s
    ));
    toast({
      title: "Application Approved",
      description: `${student.name}'s submission has been approved.`,
    });
  };

  const handleReject = (student: StudentSubmission) => {
    setStudents(prev => prev.map(s => 
      s.id === student.id ? { ...s, status: "rejected" as const, pendingCount: 0 } : s
    ));
    toast({
      title: "Application Rejected",
      description: `${student.name}'s submission has been rejected.`,
      variant: "destructive",
    });
  };

  const handleRequestRevision = (student: StudentSubmission) => {
    setActionStudent(student);
    setRevisionComment("");
    setIsRevisionDialogOpen(true);
  };

  const submitRevisionRequest = () => {
    if (actionStudent) {
      setStudents(prev => prev.map(s => 
        s.id === actionStudent.id ? { ...s, status: "revision" as const } : s
      ));
      toast({
        title: "Revision Requested",
        description: `Revision request sent to ${actionStudent.name}.`,
      });
      setIsRevisionDialogOpen(false);
      setActionStudent(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700 border-green-300">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "revision":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-300">Revision Requested</Badge>;
      default:
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
            <FileText className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <FacultySidebar />
        <main className="flex-1 p-6 lg:p-10">
          <SidebarTrigger className="mb-4" />

          <div className="w-full max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Document Review Portal</h1>
              <p className="text-muted-foreground mt-1">Review and manage submitted documents</p>
            </div>

            {/* Student Submissions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {students.map((student) => (
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
                        {getStatusBadge(student.status)}
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
                      
                      {student.status === "pending" && (
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
                      )}
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
                    onClick={() => setViewingDocument(doc)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Open
                  </Button>
                  <Button variant="outline" size="sm">
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
    </SidebarProvider>
  );
};

export default Faculty;
