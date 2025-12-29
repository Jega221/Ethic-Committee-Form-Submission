import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { FacultySidebar } from "@/components/FacultySidebar";
import { getAllApplications, processApplication, updateApplicationStatus, API_BASE_URL } from "@/lib/api";
import { Loader } from "@/components/ui/loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Check, RotateCcw, X, Download, Eye } from "lucide-react";

const committeeMembers = [
  { name: "Dr. Jane Smith", role: "Chair", expertise: "Ethics & Bioethics" },
  { name: "Dr. Robert Wilson", role: "Reviewer", expertise: "Research Methodology" },
  { name: "Prof. Sarah Chen", role: "Reviewer", expertise: "Data Privacy" },
  { name: "David Thompson", role: "Lay Member", expertise: "Community Representation" },
];

interface DecisionItem {
  id: string;
  title: string;
  status: string;
  currentStep?: string;
  date: string;
  documents: { type: string; fileName: string; url: string }[];
  applicantName?: string;
  facultyName?: string;
}

const getStatusBadge = (status: string, step?: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'approved' || s === 'accepted') {
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Approved</Badge>;
  }
  if (s === 'rejected' || s === 'declined') {
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rejected</Badge>;
  }
  if (s.includes('revision')) {
    return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Revision Required</Badge>;
  }

  return (
    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
      {step ? (step.charAt(0).toUpperCase() + step.slice(1)) : 'Pending'}
    </Badge>
  );
};

const Committee = () => {
  const { toast } = useToast();
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<DecisionItem | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "revision" | null>(null);
  const [comment, setComment] = useState("");
  const [viewFilesItem, setViewFilesItem] = useState<DecisionItem | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await getAllApplications();

      const mapped: DecisionItem[] = res.data.map((app: any) => ({
        id: String(app.application_id),
        title: app.title,
        status: app.status,
        currentStep: app.current_step,
        date: new Date(app.submission_date).toLocaleDateString(),
        applicantName: `${app.researcher_name} ${app.researcher_surname}`,
        facultyName: app.faculty_name,
        documents: (app.documents || []).map((doc: any) => ({
          type: doc.file_type || 'Document',
          fileName: doc.file_name,
          url: doc.file_url
        }))
      }));

      setDecisions(mapped);
    } catch (error) {
      console.error("Error fetching committee applications:", error);
      toast({
        title: "Error",
        description: "Failed to fetch applications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleAction = (item: DecisionItem, action: "approve" | "reject" | "revision") => {
    setSelectedItem(item);
    setActionType(action);
    setComment("");
  };

  const confirmAction = async () => {
    if (!selectedItem || !actionType) return;

    try {
      // Unify all actions to use processApplication which now supports comments
      await processApplication(selectedItem.id, actionType, comment);

      toast({
        title: "Success",
        description: `Application ${selectedItem.id} has been processed.`,
      });

      // Refresh list
      fetchApplications();
    } catch (error: any) {
      console.error("Error processing application:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to process application.",
        variant: "destructive",
      });
    } finally {
      setSelectedItem(null);
      setActionType(null);
      setComment("");
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background items-center justify-center">
          <Loader />
        </div>
      </SidebarProvider>
    );
  }

  const pendingDecisions = decisions.filter(d => {
    const step = (d.currentStep || '').toLowerCase();
    const status = (d.status || '').toLowerCase();
    return step === 'committee' && status !== 'approved' && status !== 'rejected';
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <FacultySidebar />

        <main className="flex-1 p-6 overflow-auto">
          <SidebarTrigger className="mb-4" />

          <div className="w-full max-w-7xl mx-auto space-y-10">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">Committee Members</h1>
              <p className="text-muted-foreground mt-1">Ethics Review Committee</p>
            </div>

            {/* Committee Members Table */}
            <div className="bg-card rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs text-muted-foreground font-medium">NAME</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">ROLE</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">EXPERTISE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {committeeMembers.map((member, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell className="text-muted-foreground">{member.role}</TableCell>
                      <TableCell className="text-muted-foreground">{member.expertise}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Decision Tracking Section */}
            <div>
              <h2 className="text-xs font-medium text-muted-foreground tracking-wide mb-4">DECISION TRACKING</h2>
              <div className="space-y-3">
                {pendingDecisions.length === 0 ? (
                  <div className="bg-card rounded-lg border p-8 text-center text-muted-foreground">
                    No applications pending Committee Review.
                  </div>
                ) : (
                  pendingDecisions.map((item) => (
                    <div key={item.id} className="bg-card rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">APP-{item.id}</span>
                          {getStatusBadge(item.status, item.currentStep)}
                        </div>
                        <span className="text-sm text-muted-foreground">{item.date}</span>
                      </div>
                      <p className="font-medium text-foreground mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground mb-3">{item.applicantName} • {item.facultyName}</p>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewFilesItem(item)}
                          className="gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          View Files
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(item, "approve")}
                          className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(item, "revision")}
                          className="gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Request Revision
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(item, "reject")}
                          className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Action Confirmation Dialog */}
      <Dialog open={!!selectedItem && !!actionType} onOpenChange={() => { setSelectedItem(null); setActionType(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Approve Application"}
              {actionType === "reject" && "Reject Application"}
              {actionType === "revision" && "Request Revision"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedItem?.id} - {selectedItem?.title}
            </p>
            <Textarea
              placeholder="Add a comment (optional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedItem(null); setActionType(null); }}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              className={
                actionType === "approve" ? "bg-green-600 hover:bg-green-700" :
                  actionType === "reject" ? "bg-red-600 hover:bg-red-700" :
                    "bg-orange-600 hover:bg-orange-700"
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Files Dialog */}
      <Dialog open={!!viewFilesItem} onOpenChange={() => setViewFilesItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submitted Documents</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{viewFilesItem?.id} - {viewFilesItem?.title}</p>
            {viewFilesItem?.documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{doc.type}</p>
                    <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(`${API_BASE_URL}/${doc.url}`, '_blank')}
                    title="View document"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(`${API_BASE_URL}/${doc.url}`, '_blank')}
                    title="Download document"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewFilesItem(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default Committee;
