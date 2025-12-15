import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { FacultySidebar } from "@/components/FacultySidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, RotateCcw, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const committeeMembers = [
  {
    name: "Dr. Sarah Mitchell",
    role: "Chair",
    expertise: "Medical Ethics & Bioethics",
  },
  {
    name: "Dr. James Chen",
    role: "Vice Chair",
    expertise: "Clinical Research & Oncology",
  },
  {
    name: "Prof. Maria Rodriguez",
    role: "Member",
    expertise: "Psychology & Mental Health",
  },
  {
    name: "Dr. Robert Thompson",
    role: "Member",
    expertise: "Legal & Regulatory Affairs",
  },
  {
    name: "Dr. Aisha Patel",
    role: "Member",
    expertise: "Community Health & Patient Advocacy",
  },
  {
    name: "Dr. Michael O'Brien",
    role: "Member",
    expertise: "Pharmacology & Clinical Trials",
  },
];

interface DecisionItem {
  id: string;
  title: string;
  status: string;
  date: string;
  documents: { type: string; fileName: string }[];
}

const initialDecisionTracking: DecisionItem[] = [
  {
    id: "ETH-2024-001",
    title: "Impact of AI-Assisted Diagnosis on Patient Outcomes",
    status: "Pending",
    date: "Dec 10, 2024",
    documents: [
      { type: "Informed Consent Form", fileName: "consent_form.pdf" },
      { type: "Research Protocol", fileName: "protocol_v1.pdf" },
    ],
  },
  {
    id: "ETH-2024-002",
    title: "Gene Therapy for Rare Genetic Disorders",
    status: "Pending",
    date: "Dec 8, 2024",
    documents: [
      { type: "Informed Consent Form", fileName: "gene_consent.pdf" },
      { type: "Research Protocol", fileName: "gene_protocol.pdf" },
      { type: "Data Collection Instruments", fileName: "instruments.pdf" },
    ],
  },
  {
    id: "ETH-2024-003",
    title: "Mental Health Intervention in Adolescents",
    status: "Approved",
    date: "Dec 5, 2024",
    documents: [
      { type: "Research Protocol", fileName: "mental_health_protocol.pdf" },
    ],
  },
  {
    id: "ETH-2024-004",
    title: "Experimental Drug Trial for Advanced Cancer",
    status: "Pending",
    date: "Dec 3, 2024",
    documents: [
      { type: "Informed Consent Form", fileName: "drug_consent.pdf" },
      { type: "Research Protocol", fileName: "drug_protocol.pdf" },
    ],
  },
  {
    id: "ETH-2024-005",
    title: "Unregulated Data Collection from Minors",
    status: "Rejected",
    date: "Nov 28, 2024",
    documents: [
      { type: "Research Protocol", fileName: "data_protocol.pdf" },
    ],
  },
  {
    id: "ETH-2024-006",
    title: "Cognitive Enhancement Study in Healthy Adults",
    status: "Approved",
    date: "Nov 25, 2024",
    documents: [
      { type: "Informed Consent Form", fileName: "cognitive_consent.pdf" },
      { type: "Research Protocol", fileName: "cognitive_protocol.pdf" },
    ],
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Approved":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{status}</Badge>;
    case "Revision Required":
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">{status}</Badge>;
    case "Rejected":
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">{status}</Badge>;
    case "Pending":
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">{status}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const Committee = () => {
  const { toast } = useToast();
  const [decisions, setDecisions] = useState<DecisionItem[]>(initialDecisionTracking);
  const [selectedItem, setSelectedItem] = useState<DecisionItem | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "revision" | null>(null);
  const [comment, setComment] = useState("");
  const [viewFilesItem, setViewFilesItem] = useState<DecisionItem | null>(null);

  const handleAction = (item: DecisionItem, action: "approve" | "reject" | "revision") => {
    setSelectedItem(item);
    setActionType(action);
    setComment("");
  };

  const confirmAction = () => {
    if (!selectedItem || !actionType) return;

    const newStatus = actionType === "approve" ? "Approved" : actionType === "reject" ? "Rejected" : "Revision Required";
    
    setDecisions(prev =>
      prev.map(d =>
        d.id === selectedItem.id ? { ...d, status: newStatus } : d
      )
    );

    toast({
      title: `Application ${newStatus}`,
      description: `${selectedItem.id} has been ${newStatus.toLowerCase()}.`,
    });

    setSelectedItem(null);
    setActionType(null);
    setComment("");
  };

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
                {decisions.map((item) => (
                  <div key={item.id} className="bg-card rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{item.id}</span>
                        {getStatusBadge(item.status)}
                      </div>
                      <span className="text-sm text-muted-foreground">{item.date}</span>
                    </div>
                    <p className="font-medium text-foreground mb-3">{item.title}</p>
                    
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
                      {item.status === "Pending" && (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                ))}
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
                <Button size="sm" variant="ghost">
                  <Download className="h-4 w-4" />
                </Button>
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
