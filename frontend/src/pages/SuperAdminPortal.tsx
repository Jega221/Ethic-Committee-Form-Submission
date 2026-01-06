import React, { useState, useEffect } from 'react';
import {
    Users,
    Settings,
    LayoutDashboard,
    Shield,
    Search,
    Plus,
    Trash2,
    Edit,
    CheckCircle,
    ArrowRight,
    ClipboardList,
    Building2,
    Activity,
    Save
} from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { SuperAdminSidebar } from '@/components/SuperAdminSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";
import { Loader } from '@/components/ui/loader';
import {
    getUsers,
    createUser,
    deleteUser,
    getFaculties,
    createFaculty,
    updateFaculty,
    deleteFaculty,
    getWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    setCurrentWorkflow,
    getAllApplications
} from '@/lib/api';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const normalizeSteps = (steps: any): string[] => {
    if (Array.isArray(steps)) return steps;

    if (typeof steps === 'string') {
        return steps
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
    }

    return [];
};


const SuperAdminPortal = () => {
    console.log('[SuperAdminPortal] Component mounting');
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(true);

    // Data States
    const [users, setUsers] = useState<any[]>([]);
    const [faculties, setFaculties] = useState<any[]>([]);
    const [workflows, setWorkflows] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);

    // Form States
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Researcher' });

    const [isAddFacultyOpen, setIsAddFacultyOpen] = useState(false);
    const [newFacultyName, setNewFacultyName] = useState("");

    const [editingFaculty, setEditingFaculty] = useState<any>(null);

    useEffect(() => {
        console.log('[SuperAdminPortal] useEffect - calling fetchAllData');
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            console.log('[SuperAdminPortal] fetchAllData - starting');
            setLoading(true);
            const [uRes, fRes, wRes, aRes] = await Promise.all([
                getUsers(),
                getFaculties(),
                getWorkflows(),
                getAllApplications()
            ]);
            console.log('[SuperAdminPortal] fetchAllData - got responses:', { users: uRes.data?.length, faculties: fRes.data?.length, workflows: wRes.data?.length, applications: aRes.data?.length });
            setUsers(uRes.data);
            setFaculties(fRes.data);
            setWorkflows(wRes.data);
            setApplications(aRes.data);
        } catch (err) {
            console.error("[SuperAdminPortal] Failed to fetch super admin data", err);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    // User Handlers
    const handleAddUser = async () => {
        try {
            await createUser(newUser);
            toast.success("User created successfully");
            setIsAddUserOpen(false);
            setNewUser({ name: '', email: '', role: 'Researcher' });
            fetchAllData();
        } catch (err: any) {
            toast.error(err.message || "Failed to create user");
        }
    };

    const handleDeleteUser = async (id: string | number) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        try {
            await deleteUser(id);
            toast.success("User deleted");
            fetchAllData();
        } catch (err) {
            toast.error("Failed to delete user");
        }
    };

    // Faculty Handlers
    const handleAddFaculty = async () => {
        try {
            await createFaculty(newFacultyName);
            toast.success("Faculty added");
            setNewFacultyName("");
            setIsAddFacultyOpen(false);
            fetchAllData();
        } catch (err) {
            toast.error("Failed to add faculty");
        }
    };

    const handleUpdateFaculty = async () => {
        try {
            await updateFaculty(editingFaculty.id, editingFaculty.name);
            toast.success("Faculty updated");
            setEditingFaculty(null);
            fetchAllData();
        } catch (err) {
            toast.error("Failed to update faculty");
        }
    };

    const handleDeleteFaculty = async (id: string | number) => {
        if (!confirm("Are you sure? This may affect users in this faculty.")) return;
        try {
            await deleteFaculty(id);
            toast.success("Faculty deleted");
            fetchAllData();
        } catch (err) {
            toast.error("Failed to delete faculty");
        }
    };

    // Workflow Handlers
    const [isAddWorkflowOpen, setIsAddWorkflowOpen] = useState(false);
    const DEFAULT_STEPS = ['committee_member', 'faculty_admin', 'rector'];
    const [newWorkflowSteps, setNewWorkflowSteps] = useState<string[]>(DEFAULT_STEPS);
    const [editingWorkflow, setEditingWorkflow] = useState<any>(null);

    const stepOptions = [
        'committee_member',
        'faculty_admin',
        'rector',
    ];


    const getStepLabel = (step: string): string => {
        const labels: Record<string, string> = {
            'committee_member': 'Ethic Committee',
            'faculty_admin': 'Faculty Review (Dean)',
            'rector': 'Rectorate Approval',
        };
        return labels[step] || step;
    };

    const addStep = () => {
        setNewWorkflowSteps([...newWorkflowSteps, '']);
    };

    const removeStep = (index: number) => {
        if (newWorkflowSteps.length > 1) {
            setNewWorkflowSteps(newWorkflowSteps.filter((_, i) => i !== index));
        } else {
            toast.error("Workflow must have at least 1 step");
        }
    };

    const updateStep = (index: number, value: string) => {
        const updated = [...newWorkflowSteps];
        updated[index] = value;
        setNewWorkflowSteps(updated);
    };

    const handleCreateWorkflow = async () => {
        try {
            const filteredSteps = newWorkflowSteps.filter(s => s && s.trim());
            if (filteredSteps.length === 0) {
                toast.error("Please add at least one step");
                return;
            }
            const payload = { steps: filteredSteps };
            await createWorkflow(payload);
            toast.success("Workflow created successfully");
            setIsAddWorkflowOpen(false);
            setNewWorkflowSteps(['committee_member', 'faculty_admin', 'rector']);
            fetchAllData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to create workflow");
        }
    };

    const handleUpdateWorkflow = async () => {
        if (!editingWorkflow) return;
        try {
            const filteredSteps = newWorkflowSteps.filter(s => s && s.trim());
            if (filteredSteps.length === 0) {
                toast.error("Please add at least one step");
                return;
            }
            const payload = { steps: filteredSteps };
            await updateWorkflow(editingWorkflow.id, payload);
            toast.success("Workflow updated successfully");
            setEditingWorkflow(null);
            setNewWorkflowSteps(['committee_member', 'faculty_admin', 'rector']);
            fetchAllData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to update workflow");
        }
    };

    const handleDeleteWorkflow = async (id: string | number) => {
        if (!confirm("Are you sure you want to delete this workflow?")) return;
        try {
            await deleteWorkflow(id);
            toast.success("Workflow deleted");
            fetchAllData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to delete workflow");
        }
    };

    const openEditWorkflow = (workflow: any) => {
        setEditingWorkflow(workflow);
        setNewWorkflowSteps(normalizeSteps(workflow.steps));
    };

    const handleSetCurrentWorkflow = async (id: string | number) => {
        try {
            await setCurrentWorkflow(id);
            toast.success("Target workflow activated");
            fetchAllData();
        } catch (err) {
            toast.error("Failed to switch workflow");
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader /></div>;

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-[#f8fafc]">
                <SuperAdminSidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <header className="bg-white/70 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-6 py-4">
                        <div className="flex items-center justify-between max-w-7xl mx-auto">
                            <div className="flex items-center gap-4">
                                <SidebarTrigger className="p-2 hover:bg-slate-100 rounded-lg transition-colors" />
                                <div className="flex items-center gap-3">
                                    <div className="bg-destructive/10 p-2 rounded-lg">
                                        <Shield className="w-5 h-5 text-destructive" />
                                    </div>
                                    <h1 className="text-lg font-bold text-slate-800">Super Admin Command Center</h1>
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                        <div className="max-w-7xl mx-auto space-y-8">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="bg-white p-1 rounded-xl border border-slate-200 mb-8 h-12 inline-flex">
                                    <TabsTrigger value="overview" className="rounded-lg px-6 data-[state=active]:bg-destructive data-[state=active]:text-white">Overview</TabsTrigger>
                                    <TabsTrigger value="users" className="rounded-lg px-6 data-[state=active]:bg-destructive data-[state=active]:text-white">Users</TabsTrigger>
                                    <TabsTrigger value="faculties" className="rounded-lg px-6 data-[state=active]:bg-destructive data-[state=active]:text-white">Faculties</TabsTrigger>
                                    <TabsTrigger value="workflows" className="rounded-lg px-6 data-[state=active]:bg-destructive data-[state=active]:text-white">Workflows</TabsTrigger>
                                    <TabsTrigger value="applications" className="rounded-lg px-6 data-[state=active]:bg-destructive data-[state=active]:text-white">Applications</TabsTrigger>
                                </TabsList>

                                {/* OVERVIEW TAB */}
                                <TabsContent value="overview" className="mt-0">
                                    {/* Summary Stats */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                        <Card className="border-none shadow-sm card-glass">
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between mb-2">
                                                    <Users className="w-5 h-5 text-blue-500" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-500">Total Users</p>
                                                <h3 className="text-3xl font-bold">{users.length}</h3>
                                            </CardContent>
                                        </Card>
                                        <Card className="border-none shadow-sm card-glass">
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between mb-2">
                                                    <Building2 className="w-5 h-5 text-purple-500" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-500">Faculties</p>
                                                <h3 className="text-3xl font-bold">{faculties.length}</h3>
                                            </CardContent>
                                        </Card>
                                        <Card className="border-none shadow-sm card-glass">
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between mb-2">
                                                    <ClipboardList className="w-5 h-5 text-green-500" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-500">Applications</p>
                                                <h3 className="text-3xl font-bold">{applications.length}</h3>
                                            </CardContent>
                                        </Card>
                                        <Card className="border-none shadow-sm card-glass">
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between mb-2">
                                                    <Activity className="w-5 h-5 text-orange-500" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-500">Active Workflow</p>
                                                <h3 className="text-xl font-bold truncate">
                                                    {workflows.find(w => w.status === 'current')?.id ? `ID: ${workflows.find(w => w.status === 'current')?.id}` : 'None'}
                                                </h3>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Charts Section */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* User Distribution by Role - Pie Chart */}
                                        <Card className="border-none shadow-sm card-glass">
                                            <CardHeader>
                                                <CardTitle className="text-lg font-bold">User Distribution by Role</CardTitle>
                                                <CardDescription>Breakdown of users across different roles</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <PieChart>
                                                        <Pie
                                                            data={(() => {
                                                                const roleCounts = users.reduce((acc: any, user: any) => {
                                                                    const role = user.role_name || 'Unknown';
                                                                    acc[role] = (acc[role] || 0) + 1;
                                                                    return acc;
                                                                }, {});
                                                                return Object.entries(roleCounts).map(([name, value]) => ({ name, value }));
                                                            })()}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={(entry) => `${entry.name}: ${entry.value}`}
                                                            outerRadius={100}
                                                            fill="#8884d8"
                                                            dataKey="value"
                                                        >
                                                            {(() => {
                                                                const COLORS = ['#1a0b4b', '#3a2b8b', '#5a4bab', '#f5a623', '#d4860f', '#b87333'];
                                                                const roleCounts = users.reduce((acc: any, user: any) => {
                                                                    const role = user.role_name || 'Unknown';
                                                                    acc[role] = (acc[role] || 0) + 1;
                                                                    return acc;
                                                                }, {});
                                                                return Object.entries(roleCounts).map((_, index) => (
                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                ));
                                                            })()}
                                                        </Pie>
                                                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>

                                        {/* Application Status - Bar Chart */}
                                        <Card className="border-none shadow-sm card-glass">
                                            <CardHeader>
                                                <CardTitle className="text-lg font-bold">Application Status Overview</CardTitle>
                                                <CardDescription>Current state of all submitted applications</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart
                                                        data={(() => {
                                                            const statusCounts = applications.reduce((acc: any, app: any) => {
                                                                const status = app.status || 'Unknown';
                                                                acc[status] = (acc[status] || 0) + 1;
                                                                return acc;
                                                            }, {});
                                                            return Object.entries(statusCounts).map(([name, count]) => ({ name, count }));
                                                        })()}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                        <XAxis dataKey="name" stroke="#64748b" />
                                                        <YAxis stroke="#64748b" />
                                                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                                        <Bar dataKey="count" fill="#f5a623" radius={[8, 8, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>

                                        {/* Applications by Faculty - Bar Chart */}
                                        <Card className="border-none shadow-sm card-glass lg:col-span-2">
                                            <CardHeader>
                                                <CardTitle className="text-lg font-bold">Applications by Faculty</CardTitle>
                                                <CardDescription>Distribution of research applications across faculties</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart
                                                        data={(() => {
                                                            const facultyCounts = applications.reduce((acc: any, app: any) => {
                                                                const faculty = app.faculty_name || 'Unknown';
                                                                acc[faculty] = (acc[faculty] || 0) + 1;
                                                                return acc;
                                                            }, {});
                                                            return Object.entries(facultyCounts).map(([name, count]) => ({ name, count }));
                                                        })()}
                                                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} stroke="#64748b" />
                                                        <YAxis stroke="#64748b" />
                                                        <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                                        <Bar dataKey="count" fill="#3a2b8b" radius={[8, 8, 0, 0]} />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>

                                {/* USERS TAB */}
                                <TabsContent value="users" className="mt-0 space-y-6">
                                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                        <div className="relative w-full md:w-96">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                placeholder="Search users by name or email..."
                                                className="pl-10"
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <Card className="border-none shadow-sm card-glass">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>User</TableHead>
                                                    <TableHead>Role</TableHead>
                                                    <TableHead>Faculty</TableHead>
                                                    <TableHead>Joined</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredUsers.map(u => (
                                                    <TableRow key={u.id}>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold">{u.name} {u.surname}</span>
                                                                <span className="text-xs text-slate-500">{u.email}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="capitalize">{u.role_name}</Badge>
                                                        </TableCell>
                                                        <TableCell>{u.faculty_name || 'N/A'}</TableCell>
                                                        <TableCell className="text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button size="icon" variant="ghost" onClick={() => handleDeleteUser(u.id)} className="text-destructive">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </Card>
                                </TabsContent>

                                {/* FACULTIES TAB */}
                                <TabsContent value="faculties" className="mt-0 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-bold">Faculty Management</h2>
                                        <Button onClick={() => setIsAddFacultyOpen(true)} className="bg-destructive hover:bg-destructive/90">
                                            <Plus className="w-4 h-4 mr-2" /> New Faculty
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {faculties.map(f => (
                                            <Card key={f.id} className="border-none shadow-sm card-glass overflow-hidden group">
                                                <CardContent className="p-6">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="bg-destructive/5 p-3 rounded-xl">
                                                            <Building2 className="w-6 h-6 text-destructive" />
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingFaculty(f)}>
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteFaculty(f.id)}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <h4 className="font-bold text-lg text-slate-800">{f.name}</h4>
                                                    <p className="text-sm text-slate-500 mt-1">ID: FAC-{f.id}</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </TabsContent>

                                {/* WORKFLOWS TAB */}
                                <TabsContent value="workflows" className="mt-0 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-bold">Approval Workflows</h2>
                                        <Button className="bg-destructive hover:bg-destructive/90" onClick={() => setIsAddWorkflowOpen(true)}>
                                            <Plus className="w-4 h-4 mr-2" /> Create Custom Workflow
                                        </Button>
                                    </div>
                                    <div className="space-y-4">
                                        {workflows.map(w => (
                                            <Card key={w.id} className={`border-2 shadow-none transition-all ${w.status === 'current' ? 'border-destructive bg-destructive/5' : 'border-slate-100'}`}>
                                                <CardContent className="p-6">
                                                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-3">
                                                                <h4 className="font-bold text-lg">Workflow #{w.id}</h4>
                                                                {w.status === 'current' && <Badge className="bg-destructive">ACTIVE</Badge>}
                                                            </div>
                                                            <p className="text-sm text-slate-500 italic">Sequential processing steps</p>
                                                        </div>
                                                        <div className="flex items-center gap-4 flex-wrap">
                                                            {normalizeSteps(w.steps).map((step: string, idx: number) => (
                                                                <React.Fragment key={idx}>
                                                                    <div className="bg-white border px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-600 shadow-sm capitalize">
                                                                        {step}
                                                                    </div>
                                                                    {idx < (w.steps || []).length - 1 &&
                                                                        <ArrowRight className="w-4 h-4 text-slate-300" />
                                                                    }
                                                                </React.Fragment>
                                                            ))}
                                                        </div>
                                                        {w.status !== 'current' && (
                                                            <Button variant="outline" size="sm" onClick={() => handleSetCurrentWorkflow(w.id)}>
                                                                Set as Active
                                                            </Button>
                                                        )}
                                                        <div className="flex gap-1">
                                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditWorkflow(w)}>
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteWorkflow(w.id)}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </TabsContent>

                                {/* APPLICATIONS TAB */}
                                <TabsContent value="applications" className="mt-0">
                                    <Card className="border-none shadow-sm card-glass overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Research Title</TableHead>
                                                    <TableHead>Researcher</TableHead>
                                                    <TableHead>Faculty</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Date</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {applications.map(app => (
                                                    <TableRow key={app.application_id}>
                                                        <TableCell className="font-semibold max-w-xs truncate">{app.title}</TableCell>
                                                        <TableCell>{app.researcher_name}</TableCell>
                                                        <TableCell>{app.faculty_name}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={app.status === 'Approved' ? 'default' : 'secondary'} className={app.status === 'Approved' ? 'bg-green-100 text-green-700' : ''}>
                                                                {app.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right text-xs text-slate-500">
                                                            {new Date(app.submission_date).toLocaleDateString()}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </main>
                </div>
            </div>

            {/* DIALOGS */}
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create New System User</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="e.g. John Doe" />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="john@fiu.edu" />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={newUser.role} onValueChange={r => setNewUser({ ...newUser, role: r })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="committee_member">Committee Member</SelectItem>
                                    <SelectItem value="researcher">Researcher</SelectItem>
                                    <SelectItem value="faculty_admin">Faculty Admin</SelectItem>
                                    <SelectItem value="rector">Rector</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddUser} className="bg-destructive hover:bg-destructive/90">Add User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddFacultyOpen} onOpenChange={setIsAddFacultyOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add New Faculty</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Faculty Name</Label>
                            <Input value={newFacultyName} onChange={e => setNewFacultyName(e.target.value)} placeholder="e.g. Faculty of Arts" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddFacultyOpen(false)}>Cancel</Button>
                        <Button onClick={handleAddFaculty} className="bg-destructive hover:bg-destructive/90">Create Faculty</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingFaculty} onOpenChange={() => setEditingFaculty(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Edit Faculty</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>New Faculty Name</Label>
                            <Input value={editingFaculty?.name || ''} onChange={e => setEditingFaculty({ ...editingFaculty, name: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingFaculty(null)}>Cancel</Button>
                        <Button onClick={handleUpdateFaculty} className="bg-destructive hover:bg-destructive/90">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isAddWorkflowOpen} onOpenChange={setIsAddWorkflowOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Create Custom Approval Workflow</DialogTitle></DialogHeader>
                    <div className="space-y-6 py-4">
                        <p className="text-sm text-muted-foreground">Define the sequence of approval steps. Add or remove steps using the + and - buttons. All applications will follow this order once activated.</p>

                        <div className="space-y-3">
                            {newWorkflowSteps.map((step, idx) => (
                                <div key={idx} className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Step {idx + 1}</Label>
                                        <Select value={step} onValueChange={(val) => updateStep(idx, val)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select step" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {stepOptions.map(opt => (
                                                    <SelectItem key={opt} value={opt} className="capitalize">
                                                        {getStepLabel(opt)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => removeStep(idx)}
                                        className="text-destructive hover:text-destructive"
                                        title="Remove step"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Button
                            variant="outline"
                            onClick={addStep}
                            className="w-full border-dashed"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Add Step
                        </Button>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Workflow Preview</h4>
                            <div className="flex items-center gap-2 flex-wrap">
                                {newWorkflowSteps.filter(Boolean).map((s, i, arr) => (
                                    <React.Fragment key={i}>
                                        <Badge variant="outline" className="bg-white capitalize py-1.5 px-3">{getStepLabel(s)}</Badge>
                                        {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-slate-400" />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddWorkflowOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateWorkflow} className="bg-destructive hover:bg-destructive/90">Create Workflow</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingWorkflow} onOpenChange={(open) => !open && setEditingWorkflow(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Edit Workflow #{editingWorkflow?.id}</DialogTitle></DialogHeader>
                    <div className="space-y-6 py-4">
                        <p className="text-sm text-muted-foreground">Modify the sequence of approval steps. Add or remove steps using the + and - buttons.</p>

                        <div className="space-y-3">
                            {newWorkflowSteps.map((step, idx) => (
                                <div key={idx} className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Step {idx + 1}</Label>
                                        <Select value={step} onValueChange={(val) => updateStep(idx, val)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select step" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {stepOptions.map(opt => (
                                                    <SelectItem key={opt} value={opt} className="capitalize">
                                                        {getStepLabel(opt)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => removeStep(idx)}
                                        className="text-destructive hover:text-destructive"
                                        title="Remove step"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Button
                            variant="outline"
                            onClick={addStep}
                            className="w-full border-dashed"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Add Step
                        </Button>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Workflow Preview</h4>
                            <div className="flex items-center gap-2 flex-wrap">
                                {newWorkflowSteps.filter(Boolean).map((s, i, arr) => (
                                    <React.Fragment key={i}>
                                        <Badge variant="outline" className="bg-white capitalize py-1.5 px-3">{getStepLabel(s)}</Badge>
                                        {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-slate-400" />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingWorkflow(null)}>Cancel</Button>
                        <Button onClick={handleUpdateWorkflow} className="bg-destructive hover:bg-destructive/90">Update Workflow</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </SidebarProvider>
    );
};

export default SuperAdminPortal;
