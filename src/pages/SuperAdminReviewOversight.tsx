import React, { useState } from 'react';
import { Search, Eye, Shield } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { SuperAdminSidebar } from '@/components/SuperAdminSidebar';
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

const initialApplications: Application[] = [
  {
    id: 'ETH-2024-001',
    applicantName: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@fiu.edu',
    faculty: 'Faculty of Medicine',
    researchTitle: 'Impact of Telemedicine on Patient Outcomes',
    submissionDate: '2024-01-15',
    status: 'pending',
    riskLevel: 'Medium',
  },
  {
    id: 'ETH-2024-002',
    applicantName: 'Prof. Michael Chen',
    email: 'michael.chen@fiu.edu',
    faculty: 'Faculty of Engineering',
    researchTitle: 'AI-Driven Analysis of Student Learning Patterns',
    submissionDate: '2024-01-12',
    status: 'under_review',
    riskLevel: 'Low',
  },
  {
    id: 'ETH-2024-003',
    applicantName: 'Dr. Emily Rodriguez',
    email: 'emily.rodriguez@fiu.edu',
    faculty: 'Faculty of Psychology',
    researchTitle: 'Mental Health Interventions for University Students',
    submissionDate: '2024-01-10',
    status: 'approved',
    riskLevel: 'High',
  },
  {
    id: 'ETH-2024-004',
    applicantName: 'Dr. James Wilson',
    email: 'james.wilson@fiu.edu',
    faculty: 'Faculty of Business',
    researchTitle: 'Consumer Behavior in Digital Markets',
    submissionDate: '2024-01-08',
    status: 'revision_required',
    riskLevel: 'Low',
  },
];

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

const SuperAdminReviewOversight = () => {
  const [applications] = useState<Application[]>(initialApplications);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-secondary/30">
        <SuperAdminSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 py-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="p-2 hover:bg-accent rounded-lg transition-colors" />
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold text-foreground">
                      Review Oversight
                    </h1>
                    <Badge variant="destructive" className="gap-1">
                      <Shield className="w-3 h-3" />
                      Super Admin
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Super Admin / Review Oversight
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
                          <div className="flex items-center justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(app)}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
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

    </SidebarProvider>
  );
};

export default SuperAdminReviewOversight;