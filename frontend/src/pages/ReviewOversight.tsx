import React, { useState } from 'react';
import { Search, Eye, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Application {
  id: string;
  applicantName: string;
  email: string;
  faculty: string;
  researchTitle: string;
  submissionDate: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'revision_required';
  riskLevel: string;
}

const initialApplications: Application[] = [];

const statusLabels: Record<string, string> = {
  pending: 'Pending Review',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  revision_required: 'Revision Required',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  under_review: 'bg-blue-100 text-blue-800 border-blue-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  revision_required: 'bg-orange-100 text-orange-800 border-orange-200',
};

const ReviewOversight = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'revision'>('approve');
  const [comments, setComments] = useState('');

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const mappedApps = data.map((app: any) => ({
          id: app.application_id.toString(),
          applicantName: `${app.researcher_name} ${app.researcher_surname}`,
          email: app.email,
          faculty: app.faculty_name,
          researchTitle: app.title,
          submissionDate: app.submission_date,
          status: app.status.toLowerCase().replace(' ', '_'), // Normalize 'Pending' -> 'pending', 'Revision Requested' -> 'revision_required' ?
          riskLevel: 'Medium' // Placeholder
        }));

        // Fix status mapping manually if needed
        const statusMap: any = {
          'pending': 'pending',
          'pending review': 'pending',
          'under review': 'under_review',
          'approved': 'approved',
          'rejected': 'rejected',
          'revision requested': 'revision_required',
          'revision_required': 'revision_required'

        };

        const finalApps = mappedApps.map((a: any) => ({
          ...a,
          status: statusMap[a.status] || a.status
        }));

        setApplications(finalApps);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  React.useEffect(() => {
    fetchApplications();
  }, []);

  const filteredApplications = applications.filter(app => {
    const matchesSearch =
      app.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.researchTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (app: Application) => {
    setSelectedApp(app);
    setIsDetailOpen(true);
  };

  const handleAction = (app: Application, action: 'approve' | 'reject' | 'revision') => {
    setSelectedApp(app);
    setActionType(action);
    setComments('');
    setIsActionOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedApp) return;

    // Map actionType to backend status string
    const statusMap = {
      'approve': 'Approved',
      'reject': 'Rejected',
      'revision': 'Revision Requested'
    };
    const newBackendStatus = statusMap[actionType];

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/applications/${selectedApp.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: newBackendStatus,
          comment: comments
        })
      });

      if (response.ok) {
        // Refresh list
        fetchApplications();
        setIsActionOpen(false);
        setComments('');
      } else {
        console.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getActionTitle = () => {
    switch (actionType) {
      case 'approve': return 'Approve Application';
      case 'reject': return 'Reject Application';
      case 'revision': return 'Request Revision';
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-secondary/30">
        <AdminSidebar />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 py-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="p-2 hover:bg-accent rounded-lg transition-colors" />
                <div>
                  <h1 className="text-lg font-semibold text-foreground">
                    Review Oversight
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Dashboard / Review Oversight
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-2xl font-bold text-yellow-800">
                    {applications.filter(a => a.status === 'pending').length}
                  </p>
                  <p className="text-sm text-yellow-600">Pending</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-2xl font-bold text-blue-800">
                    {applications.filter(a => a.status === 'under_review').length}
                  </p>
                  <p className="text-sm text-blue-600">Under Review</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-2xl font-bold text-green-800">
                    {applications.filter(a => a.status === 'approved').length}
                  </p>
                  <p className="text-sm text-green-600">Approved</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-2xl font-bold text-orange-800">
                    {applications.filter(a => a.status === 'revision_required').length}
                  </p>
                  <p className="text-sm text-orange-600">Needs Revision</p>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID, applicant, or title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="revision_required">Revision Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>ID</TableHead>
                      <TableHead>Applicant</TableHead>
                      <TableHead className="hidden md:table-cell">Research Title</TableHead>
                      <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-mono text-sm">{app.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{app.applicantName}</p>
                            <p className="text-sm text-muted-foreground">{app.faculty}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-xs truncate">
                          {app.researchTitle}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {new Date(app.submissionDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[app.status]}>
                            {statusLabels[app.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(app)}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {(app.status === 'pending' || app.status === 'under_review') && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleAction(app, 'approve')}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Approve"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleAction(app, 'reject')}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleAction(app, 'revision')}
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  title="Request Revision"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* View Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">Application Details</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Application ID</Label>
                  <p className="font-mono">{selectedApp.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant="outline" className={statusColors[selectedApp.status]}>
                    {statusLabels[selectedApp.status]}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Applicant</Label>
                <p className="font-medium">{selectedApp.applicantName}</p>
                <p className="text-sm text-muted-foreground">{selectedApp.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Faculty</Label>
                <p>{selectedApp.faculty}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Research Title</Label>
                <p>{selectedApp.researchTitle}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Submission Date</Label>
                  <p>{new Date(selectedApp.submissionDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Risk Level</Label>
                  <p>{selectedApp.riskLevel}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getActionTitle()}</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You are about to {actionType === 'approve' ? 'approve' : actionType === 'reject' ? 'reject' : 'request revision for'} the application <strong>{selectedApp.id}</strong> by {selectedApp.applicantName}.
              </p>
              <div>
                <Label htmlFor="comments">Comments (Optional)</Label>
                <Textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add any comments or feedback..."
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              className={
                actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-orange-600 hover:bg-orange-700'
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default ReviewOversight;
