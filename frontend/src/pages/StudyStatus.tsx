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
    fileUrl?: string; // Relative path for download API
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
    { key: 'faculty_admin', label: 'Faculty Review', color: 'bg-info' },
    { key: 'committee_member', label: 'Committee Review', color: 'bg-warning' },
    { key: 'rector', label: 'Rector Decision', color: 'bg-primary' },
];

const getStatusIndex = (status: string): number => {
    const s = (status || '').toLowerCase();
    if (s === 'faculty_admin') return 1;
    if (s === 'committee_member') return 2;
    if (s === 'rector' || s === 'rectorate') return 3;
    if (s === 'approved' || s === 'final' || s === 'done') return 4;
    return 0;
};

const getExpectedDecisionDate = (submissionDate: string): string => {
    const date = new Date(submissionDate);
    date.setDate(date.getDate() + 30);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export default function StudyStatus() {
    const [applications, setApplications] = useState<SubmittedApplication[]>([]);
    const [currentApplicationIndex, setCurrentApplicationIndex] = useState(0);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showAllApplications, setShowAllApplications] = useState(false);

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
                            fileUrl: url, // Store relative path for download API
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

                // Sort: pending applications first, then completed ones
                const sorted = mapped.sort((a, b) => {
                    const aCompleted = ['approved', 'final', 'done'].includes(a.status.toLowerCase());
                    const bCompleted = ['approved', 'final', 'done'].includes(b.status.toLowerCase());

                    if (aCompleted === bCompleted) {
                        // Same completion status, sort by date (newest first)
                        return new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime();
                    }
                    // Pending first
                    return aCompleted ? 1 : -1;
                });

                setApplications(sorted);
                // persist a client-side copy for offline/viewing older submissions
                try { localStorage.setItem('submittedApplications', JSON.stringify(sorted)); } catch { }
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

    // Auto-progression: Poll for status changes and move to next pending application
    useEffect(() => {
        if (applications.length === 0) return;

        const currentApp = applications[currentApplicationIndex];
        if (!currentApp) return;

        const prevStatus = currentApp.status;

        const pollInterval = setInterval(async () => {
            try {
                const profileStr = localStorage.getItem('userProfile');
                if (!profileStr) return;

                const user = JSON.parse(profileStr);
                if (!user?.id) return;

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
                            fileUrl: url, // Store relative path for download API
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

                // Sort: pending applications first, then completed ones
                const sorted = mapped.sort((a, b) => {
                    const aCompleted = ['approved', 'final', 'done'].includes(a.status.toLowerCase());
                    const bCompleted = ['approved', 'final', 'done'].includes(b.status.toLowerCase());

                    if (aCompleted === bCompleted) {
                        return new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime();
                    }
                    return aCompleted ? 1 : -1;
                });

                const updatedCurrentApp = sorted.find(app => app.id === currentApp.id);

                // Check if current application just got approved
                if (updatedCurrentApp) {
                    const newStatus = updatedCurrentApp.status.toLowerCase();
                    const wasApproved = ['approved', 'final', 'done'].includes(newStatus) &&
                        !['approved', 'final', 'done'].includes(prevStatus.toLowerCase());

                    if (wasApproved) {
                        // Find next pending application
                        const nextPendingIndex = sorted.findIndex((app, idx) =>
                            idx > currentApplicationIndex &&
                            !['approved', 'final', 'done'].includes(app.status.toLowerCase())
                        );

                        if (nextPendingIndex !== -1) {
                            // Wait 2 seconds then move to next
                            setTimeout(() => {
                                setCurrentApplicationIndex(nextPendingIndex);
                            }, 2000);
                        }
                    }
                }

                setApplications(sorted);
                try { localStorage.setItem('submittedApplications', JSON.stringify(sorted)); } catch { }
            } catch (err) {
                console.error('Failed to poll applications', err);
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(pollInterval);
    }, [applications, currentApplicationIndex]);

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

    const handleDownloadDocument = async (doc: Document) => {
        if (!doc.fileUrl) {
            // eslint-disable-next-line no-alert
            alert('File data not available. This submission was made before file storage was enabled. Please submit a new application.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${API_BASE_URL}/api/files/download?fileUrl=${encodeURIComponent(doc.fileUrl)}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = doc.fileName;
            a.click();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download error:', err);
            // eslint-disable-next-line no-alert
            alert('Failed to download file. Please try again.');
        }
    };

    const clearOldSubmissions = () => {
        localStorage.removeItem('submittedApplications');
        setApplications([]);
    };

    const currentApplication = applications[currentApplicationIndex];
    const currentStatusIndex = currentApplication ? getStatusIndex(currentApplication.status) : 0;

    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');

    // Navigation functions
    const goToNextApplication = () => {
        if (currentApplicationIndex < applications.length - 1) {
            setCurrentApplicationIndex(currentApplicationIndex + 1);
        }
    };

    const goToPreviousApplication = () => {
        if (currentApplicationIndex > 0) {
            setCurrentApplicationIndex(currentApplicationIndex - 1);
        }
    };

    const goToApplication = (index: number) => {
        setCurrentApplicationIndex(index);
        setShowAllApplications(false);
    };

    // Calculate progress stats
    const completedCount = applications.filter(app =>
        ['approved', 'final', 'done'].includes(app.status.toLowerCase())
    ).length;
    const pendingCount = applications.length - completedCount;
    const progressPercentage = applications.length > 0
        ? Math.round((completedCount / applications.length) * 100)
        : 0;

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
                        ) : currentApplication ? (
                            <>
                                {/* Progress Tracking Header */}
                                {applications.length > 1 && (
                                    <Card className="mb-6 border-primary/30 bg-primary/5">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <h3 className="text-foreground font-semibold text-sm">
                                                        Application {currentApplicationIndex + 1} of {applications.length}
                                                    </h3>
                                                    <p className="text-muted-foreground text-xs mt-1">
                                                        ✓ {completedCount} Completed • ⏳ {pendingCount} Pending
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setShowAllApplications(!showAllApplications)}
                                                    className="text-xs"
                                                >
                                                    {showAllApplications ? 'Hide' : 'View All'}
                                                </Button>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-success transition-all duration-500"
                                                    style={{ width: `${progressPercentage}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground text-right mt-1">{progressPercentage}% Complete</p>

                                            {/* Navigation Controls */}
                                            <div className="flex gap-2 mt-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={goToPreviousApplication}
                                                    disabled={currentApplicationIndex === 0}
                                                    className="flex-1"
                                                >
                                                    ← Previous
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={goToNextApplication}
                                                    disabled={currentApplicationIndex === applications.length - 1}
                                                    className="flex-1"
                                                >
                                                    Next →
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* All Applications List View */}
                                {showAllApplications && (
                                    <Card className="mb-6 border-border/50">
                                        <CardContent className="p-4">
                                            <h3 className="text-foreground font-semibold mb-3">All Applications</h3>
                                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                                {applications.map((app, index) => {
                                                    const isCompleted = ['approved', 'final', 'done'].includes(app.status.toLowerCase());
                                                    const isCurrent = index === currentApplicationIndex;

                                                    return (
                                                        <div
                                                            key={app.id}
                                                            onClick={() => goToApplication(index)}
                                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${isCurrent
                                                                ? 'border-primary bg-primary/10'
                                                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-medium truncate">{app.title}</span>
                                                                        {isCompleted && (
                                                                            <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        Submitted: {new Date(app.submissionDate).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                                <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2 ${isCompleted
                                                                    ? 'bg-success/20 text-success'
                                                                    : 'bg-warning/20 text-warning'
                                                                    }`}>
                                                                    {app.status}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

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
                                            <p className="text-foreground text-lg font-semibold">{currentApplication.title || 'Untitled Research'}</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="flex justify-center mb-6">
                                    <span className={getStatusBadgeClass(currentApplication.status)}>
                                        {currentApplication.status}
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
                                                        className={`w-10 h-10 rounded-full border-3 flex items-center justify-center transition-all duration-300 ${index < currentStatusIndex
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
                                                    <span className={`text-xs mt-3 text-center font-medium ${index < currentStatusIndex
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
                                            <p className="text-muted-foreground text-sm">{new Date(currentApplication.submissionDate).toLocaleDateString()}</p>
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
                                            <p className="text-muted-foreground text-sm">{getExpectedDecisionDate(currentApplication.submissionDate)}</p>
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

                                {['revision requested', 'rejected'].includes(currentApplication.status.toLowerCase()) && (
                                    <div className="flex justify-center mb-8">
                                        <Button
                                            variant="default"
                                            size="lg"
                                            // Redirect to edit page or open edit modal
                                            // For now, let's assume we use the same NewApplication page with state or a specific EditApplication route
                                            // But since I don't see an edit route in recent files, I might need to check App.tsx or routes.
                                            // I'll add a placeholder onClick for now or link to /new-application?edit={id}
                                            onClick={() => window.location.href = `/new-application?edit=${currentApplication.id}`}
                                            className="w-full md:w-1/2 py-6 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg"
                                        >
                                            <FileText className="w-5 h-5 mr-2" />
                                            Edit / Resubmit Application
                                        </Button>
                                    </div>
                                )}

                                <Card className="mb-8 border-border/50 shadow-sm">
                                    <CardContent className="p-5">
                                        <h2 className="text-primary font-semibold mb-4 flex items-center gap-2">
                                            <FileText className="w-5 h-5" />
                                            Uploaded Documents
                                        </h2>
                                        <div className="space-y-3">
                                            {currentApplication.documents.length > 0 ? (
                                                currentApplication.documents.map((doc, index) => (
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

                                            {currentApplication.documents.length > 0 && !currentApplication.documents[0]?.fileData && (
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
                                                        <p className="text-lg font-mono font-semibold text-foreground">{currentApplication.id}</p>
                                                    </div>
                                                    <span className={getStatusPillClass(currentApplication.status)}>
                                                        {currentApplication.status}
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
                                                                    : currentApplication.applicantName || 'Not specified'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Email</p>
                                                            <p className="text-foreground font-medium">{userProfile.email || currentApplication.email || 'Not specified'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Faculty</p>
                                                            <p className="text-foreground font-medium">{userProfile.faculty || currentApplication.faculty || 'Not specified'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Submission Date</p>
                                                            <p className="text-foreground font-medium">{currentApplication.submissionDate}</p>
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
                                                            <p className="text-foreground font-medium">{currentApplication.title || 'Untitled Research'}</p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Research Type</p>
                                                                <p className="text-foreground font-medium">{currentApplication.researchType || 'Not specified'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Funding Source</p>
                                                                <p className="text-foreground font-medium">{currentApplication.fundingSource || 'Not specified'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Start Date</p>
                                                                <p className="text-foreground font-medium">{currentApplication.startDate || 'Not specified'}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">End Date</p>
                                                                <p className="text-foreground font-medium">{currentApplication.endDate || 'Not specified'}</p>
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
                                                            <p className="text-foreground font-medium">{currentApplication.participantCount || 'Not specified'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Vulnerable Populations</p>
                                                            <p className="text-foreground font-medium">{currentApplication.vulnerablePopulations || 'None'}</p>
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
                                                            <p className="text-foreground font-medium">{currentApplication.riskLevel || 'Not specified'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Data Protection Measures</p>
                                                            <p className="text-foreground font-medium">{currentApplication.dataProtection || 'Not specified'}</p>
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
                                                        {currentApplication.documents.length > 0 ? (
                                                            currentApplication.documents.map((doc, index) => (
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
            </div >
        </SidebarProvider >
    );
}