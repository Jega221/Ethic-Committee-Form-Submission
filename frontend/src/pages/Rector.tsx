import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { RectorSidebar } from "@/components/RectorSidebar";
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

interface ApplicationSubmission {
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

const Rector = () => {
    const { toast } = useToast();
    const [applications, setApplications] = useState<ApplicationSubmission[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedApp, setSelectedApp] = useState<ApplicationSubmission | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isRevisionDialogOpen, setIsRevisionDialogOpen] = useState(false);
    const [revisionComment, setRevisionComment] = useState("");
    const [actionApp, setActionApp] = useState<ApplicationSubmission | null>(null);
    const [viewingDocument, setViewingDocument] = useState<{ name: string; type: string; date: string; url: string } | null>(null);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const res = await getAllApplications();

            const mapped: ApplicationSubmission[] = res.data
                .map((app: any) => ({
                    id: String(app.application_id),
                    name: `${app.researcher_name} ${app.researcher_surname}`,
                    initials: `${app.researcher_name?.[0] || ''}${app.researcher_surname?.[0] || ''}`,
                    program: app.faculty_name || "Unknown Faculty",
                    studentId: `APP-${app.application_id}`,
                    email: app.email,
                    pendingCount: 1,
                    latestSubmission: app.title,
                    submissionDate: new Date(app.submission_date).toLocaleDateString(),
                    status: app.status,
                    currentStep: app.current_step,
                    documents: (app.documents || []).map((doc: any) => ({
                        name: doc.file_name,
                        type: doc.file_type,
                        date: new Date(app.submission_date).toLocaleDateString(),
                        url: doc.file_url
                    }))
                }));

            setApplications(mapped);
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

    const handleViewDocuments = (app: ApplicationSubmission) => {
        setSelectedApp(app);
        setIsDialogOpen(true);
    };

    const handleApprove = async (app: ApplicationSubmission) => {
        try {
            await processApplication(app.id, 'approve');
            toast({
                title: "Application Approved",
                description: `${app.name}'s submission has been approved by the Rectorate.`,
            });
            fetchApplications();
        } catch (error: any) {
            toast({
                title: "Action Failed",
                description: error.message || "Failed to approve application.",
                variant: "destructive",
            });
        }
    };

    const handleReject = async (app: ApplicationSubmission) => {
        try {
            await processApplication(app.id, 'rejected');
            toast({
                title: "Application Rejected",
                description: `${app.name}'s submission has been rejected.`,
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

    const handleRequestRevision = (app: ApplicationSubmission) => {
        setActionApp(app);
        setRevisionComment("");
        setIsRevisionDialogOpen(true);
    };

    const submitRevisionRequest = async () => {
        if (actionApp) {
            try {
                await processApplication(actionApp.id, 'revision', revisionComment);
                toast({
                    title: "Revision Requested",
                    description: `Revision request for ${actionApp.name} has been sent. Application reset to first step.`,
                });
                setIsRevisionDialogOpen(false);
                setActionApp(null);
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

        if (s === 'approved') return <Badge className="bg-green-100 text-green-700 border-green-300">Approved</Badge>;
        if (s === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
        if (s.includes('revision')) return <Badge className="bg-amber-100 text-amber-700 border-amber-300">Revision Requested</Badge>;

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
                    <RectorSidebar />
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
                <RectorSidebar />
                <main className="flex-1 p-6 lg:p-10">
                    <SidebarTrigger className="mb-4" />

                    <div className="w-full max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-foreground">Rectorate Review Portal</h1>
                            <p className="text-muted-foreground mt-1">Final decision-making portal for submitted ethics committee applications.</p>
                        </div>

                        {/* Applications Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {applications
                                .filter(s => {
                                    const step = String(s.currentStep || '').toLowerCase();
                                    const status = (s.status || '').toLowerCase();
                                    return step === 'rector' && status !== 'rejected';
                                })
                                .length === 0 && (
                                    <div className="col-span-full text-center p-8 text-muted-foreground border-2 border-dashed rounded-xl">
                                        No applications pending Rectorate Review.
                                    </div>
                                )}

                            {applications
                                .filter(s => {
                                    const step = (s.currentStep || '').toLowerCase();
                                    const status = (s.status || '').toLowerCase();
                                    return step === 'rector' && status !== 'rejected';
                                })
                                .map((app) => (
                                    <Card key={app.id} className="border border-border hover:shadow-lg transition-all duration-300 bg-card/50 backdrop-blur-sm">
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4 mb-4">
                                                <Avatar className="h-14 w-14 bg-primary/10 border border-primary/20">
                                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                                                        {app.initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-foreground truncate">{app.name}</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground truncate">{app.program}</p>
                                                    <p className="text-xs text-muted-foreground mt-1 font-mono">ID: {app.studentId}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                <p className="text-sm text-muted-foreground truncate">{app.email}</p>
                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(app.status, app.currentStep)}
                                                    <span className="text-xs text-muted-foreground">
                                                        {app.documents.length} document{app.documents.length !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-3 bg-muted/50 rounded-lg mb-4 border border-border/50">
                                                <p className="text-xs text-muted-foreground">Latest submission</p>
                                                <p className="text-sm font-medium truncate">{app.latestSubmission}</p>
                                                <p className="text-xs text-muted-foreground">{app.submissionDate}</p>
                                            </div>

                                            <div className="space-y-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full justify-center group"
                                                    onClick={() => handleViewDocuments(app)}
                                                >
                                                    <Eye className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
                                                    View Documents ({app.documents.length})
                                                </Button>

                                                <div className="grid grid-cols-3 gap-2">
                                                    <Button
                                                        size="sm"
                                                        title="Approve"
                                                        className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                                        onClick={() => handleApprove(app)}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        title="Request Revision"
                                                        className="text-amber-600 border-amber-300 hover:bg-amber-50 shadow-sm"
                                                        onClick={() => handleRequestRevision(app)}
                                                    >
                                                        <MessageSquare className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        title="Reject"
                                                        className="shadow-sm"
                                                        onClick={() => handleReject(app)}
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
                        <DialogTitle>Documents - {selectedApp?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-4">
                        {selectedApp?.documents.map((doc, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 border border-border rounded-lg bg-card/50 hover:bg-accent/10 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/5 rounded-md">
                                        <FileText className="h-5 w-5 text-primary/70" />
                                    </div>
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
                                        className="h-8 px-2"
                                        onClick={() => window.open(`${API_BASE_URL}/${doc.url}`, '_blank')}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-2"
                                        onClick={() => window.open(`${API_BASE_URL}/${doc.url}`, '_blank')}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Revision Request Dialog */}
            <Dialog open={isRevisionDialogOpen} onOpenChange={setIsRevisionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Revision - {actionApp?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="text-sm font-medium">Comments for revision:</label>
                            <Textarea
                                placeholder="Enter your comments and specific requirements for revision..."
                                value={revisionComment}
                                onChange={(e) => setRevisionComment(e.target.value)}
                                className="mt-2"
                                rows={4}
                            />
                            <p className="text-[10px] text-muted-foreground mt-2">
                                Note: Requesting a revision will move this application back to the "Supervisor Review" step.
                            </p>
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

export default Rector;
