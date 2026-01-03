import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2 } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { toast } from "sonner";
import { setUserRole, setUserRoles, setUserFaculty, getFaculties, getUsers, getRolesList } from '@/lib/api';
import { Loader2, AlertCircle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  role_id?: number;
  roles?: string[];
  faculty_id?: number;
  faculty_name?: string;
  status: string;
}

const initialUsers: User[] = [];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  React.useEffect(() => {
    const profile = localStorage.getItem('userProfile');
    if (profile) setUserProfile(JSON.parse(profile));
  }, []);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching users and faculties...');

        const [uRes, fRes] = await Promise.all([
          getUsers(),
          getFaculties()
        ]);

        if (Array.isArray(uRes.data)) {
          const mappedUsers = uRes.data.map((u: any) => ({
            id: u.id?.toString() || Math.random().toString(),
            name: `${u.name || ''} ${u.surname || ''}`.trim() || 'No Name',
            email: u.email || 'No Email',
            role: u.role_name || 'User',
            role_id: u.role_id,
            roles: Array.isArray(u.roles) ? u.roles : (u.role_name ? [u.role_name] : []),
            faculty_id: u.faculty_id,
            faculty_name: u.faculty_name,
            status: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'
          }));
          setUsers(mappedUsers);
        } else {
          console.error('Users data is not an array:', uRes.data);
          setError('Invalid data format received for users');
        }

        setFaculties(Array.isArray(fRes.data) ? fRes.data : []);
      } catch (error: any) {
        const status = error.response?.status;
        const message = error.response?.data?.message || "";

        // Auto-logout if session is expired or invalid
        if (status === 403 && (message.includes("expired") || message.includes("JWT_VERIFY_FAIL"))) {
          toast.error("Session expired. Please log in again.");
          localStorage.clear();
          navigate('/login');
          return;
        }

        console.error('Failed to fetch data:', error);
        const serverMessage = message || error.message || 'Failed to connection to server';
        setError(serverMessage);
        toast.error(`Error: ${serverMessage}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRoleChange = async (userId: string, roleId: string) => {
    try {
      await setUserRole(userId, roleId);
      toast.success("User role updated");
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role_id: parseInt(roleId) } : u));

      // If the current logged-in user changed their own role, refresh local profile to avoid stale role data
      try {
        const profileRaw = localStorage.getItem('userProfile');
        if (profileRaw) {
          const profile = JSON.parse(profileRaw);
          if (String(profile.id) === String(userId)) {
            // Fetch fresh users and update the local profile entry for this user
            const fresh = await getUsers();
            if (Array.isArray(fresh.data)) {
              const updated = fresh.data.find((fu: any) => String(fu.id) === String(userId));
              if (updated) {
                const updatedProfile = {
                  ...profile,
                  name: updated.name || profile.name,
                  surname: updated.surname || profile.surname,
                  email: updated.email || profile.email,
                  roles: Array.isArray(updated.roles) ? updated.roles : (updated.role_name ? [updated.role_name] : []),
                  role: updated.role_name || profile.role,
                };
                localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
              }
            }
          }
        }
      } catch (refreshErr) {
        console.warn('Failed to refresh local profile after role change', refreshErr);
      }
    } catch (err) {
      toast.error("Failed to update role");
    }
  };

  const handleFacultyChange = async (userId: string, facultyId: string) => {
    try {
      await setUserFaculty(userId, facultyId);
      toast.success("User faculty updated");
      // Update local state
      const fac = faculties.find(f => f.id.toString() === facultyId);
      setUsers(users.map(u => u.id === userId ? { ...u, faculty_id: parseInt(facultyId), faculty_name: fac?.name || '' } : u));
    } catch (err) {
      toast.error("Failed to update faculty");
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Researcher');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [rolesList, setRolesList] = useState<{id:number, role_name:string}[]>([]);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [manageUserId, setManageUserId] = useState<string | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  const displayRoleLabel = (r: string) => {
    if (!r) return '';
    const cleaned = String(r).replace(/[_-]/g, ' ').trim();
    return cleaned.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  };

  const filteredUsers = users.filter(user => {
    const searchLow = searchQuery.toLowerCase();
    const name = user.name?.toLowerCase() || '';
    const email = user.email?.toLowerCase() || '';

    const matchesSearch = name.includes(searchLow) || email.includes(searchLow);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== id));
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const handleAddUser = async () => {
    if (newUserName && newUserEmail) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newUserName,
            email: newUserEmail,
            role: newUserRole
          })
        });

        if (response.ok) {
          const data = await response.json();
          // Add returned user to state
          const u = data.user;
          const newUser: User = {
            id: u.id.toString(),
            name: `${u.name} ${u.surname}`,
            email: u.email,
            role: u.role_name || newUserRole,
            role_id: u.role_id,
            status: 'Just Now',
          };
          setUsers([...users, newUser]);
          setNewUserName('');
          setNewUserEmail('');
          setNewUserRole('Researcher');
          setIsAddUserOpen(false);
        } else {
          const err = await response.json();
          alert(err.message || 'Failed to add user');
        }
      } catch (error) {
        console.error('Error adding user:', error);
        alert('Error adding user');
      }
    }
  };

  // Load available roles for the Manage Roles dialog
  React.useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await getRolesList();
        if (res.data && Array.isArray(res.data.roles)) setRolesList(res.data.roles);
      } catch (err) {
        console.warn('Failed to load roles list', err);
      }
    };
    loadRoles();
  }, []);

  const openManageDialog = (user: User) => {
    setManageUserId(user.id);
    // Map user's role names to ids where possible
    const mappedIds: number[] = [];
    if (Array.isArray(user.roles) && user.roles.length > 0) {
      for (const r of user.roles) {
        const found = rolesList.find(rr => String(rr.role_name).toLowerCase() === String(r).toLowerCase());
        if (found) mappedIds.push(found.id);
      }
    }
    setSelectedRoleIds(mappedIds);
    setIsManageOpen(true);
  };

  const toggleRoleSelection = (roleId: number) => {
    setSelectedRoleIds(prev => prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]);
  };

  const saveManagedRoles = async () => {
    if (!manageUserId) return;
    try {
      await setUserRoles(manageUserId, selectedRoleIds);
      toast.success('Roles updated');

      // Update local users state: map role ids back to names
      const updatedUsers = users.map(u => {
        if (u.id !== manageUserId) return u;
        const newRoleNames = rolesList.filter(r => selectedRoleIds.includes(r.id)).map(r => r.role_name);
        return { ...u, roles: newRoleNames, role_name: newRoleNames[0] || u.role } as any;
      });
      setUsers(updatedUsers);

      // If current user changed their own roles, refresh profile in localStorage
      const profileRaw = localStorage.getItem('userProfile');
      if (profileRaw) {
        const profile = JSON.parse(profileRaw);
        if (String(profile.id) === String(manageUserId)) {
          const updatedProfile = { ...profile, roles: updatedUsers.find(u => u.id === manageUserId)?.roles || [] };
          localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        }
      }

      setIsManageOpen(false);
      setManageUserId(null);
      setSelectedRoleIds([]);
    } catch (err) {
      console.error('Failed to set roles', err);
      toast.error('Failed to update roles');
    }
  };

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Status'].join(','),
      ...users.map(user => [user.name, user.email, user.role, user.status].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
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
                  <h1 className="text-lg font-semibold text-foreground">User Management</h1>
                  <p className="text-sm text-muted-foreground">Dashboard / User Management</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {userProfile?.role === 'super_admin' && (
                  <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#1a0b4b] hover:bg-[#3a2b8b]">Add User</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            placeholder="john@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Initial Role</Label>
                          <Select value={newUserRole} onValueChange={setNewUserRole}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Researcher">Researcher</SelectItem>
                              <SelectItem value="Faculty Admin">Faculty Admin</SelectItem>
                              <SelectItem value="Admin">Admin</SelectItem>
                              <SelectItem value="Committee Member">Committee Member</SelectItem>
                              <SelectItem value="Rector">Rector</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddUser} className="w-full">Create User</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                <button onClick={handleExport} className="border px-3 py-2 rounded">Export</button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                {/* Using dynamic Input to avoid SSR issues */}
                {/* @ts-ignore */}
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e: any) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label>Role Filter</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Faculty Admin">Faculty Admin</SelectItem>
                      <SelectItem value="Researcher">Researcher</SelectItem>
                      <SelectItem value="Committee Member">Committee Member</SelectItem>
                      <SelectItem value="Rector">Rector</SelectItem>
                      <SelectItem value="Super Admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status Filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-lg border border-border overflow-hidden bg-card">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Fetching users...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-destructive">
                    <AlertCircle className="w-12 h-12" />
                    <div className="text-center">
                      <p className="font-semibold italic font-serif">Oops! Something went wrong</p>
                      <p className="text-sm opacity-80">{error}</p>
                    </div>
                    <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Search className="w-12 h-12 mb-4 opacity-20" />
                    <p>No users found matching your filters.</p>
                  </div>
                ) : (
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>User / Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Faculty</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-12 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{user.name}</span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <Select
                                value={user.role_id?.toString()}
                                onValueChange={(val) => handleRoleChange(user.id, val)}
                              >
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">Super Admin</SelectItem>
                                  <SelectItem value="2">Committee Member</SelectItem>
                                  <SelectItem value="3">Researcher</SelectItem>
                                  <SelectItem value="4">Faculty Admin</SelectItem>
                                  <SelectItem value="5">Rector</SelectItem>
                                  <SelectItem value="6">Admin</SelectItem>
                                </SelectContent>
                              </Select>

                              <div className="mt-2 flex flex-wrap gap-2">
                                {Array.isArray(user.roles) && user.roles.length > 0 ? (
                                  user.roles.map((r, idx) => (
                                    <span key={idx} className="text-[10px] px-2 py-1 bg-slate-100 rounded-full text-slate-700">
                                      {displayRoleLabel(String(r))}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">No roles</span>
                                )}
                              </div>
                              <div className="mt-2">
                                <button onClick={() => openManageDialog(user)} className="text-xs text-primary underline">Manage roles</button>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.faculty_id?.toString()}
                              onValueChange={(val) => handleFacultyChange(user.id, val)}
                            >
                              <SelectTrigger className="w-40 h-8 text-xs">
                                <SelectValue placeholder="Faculty" />
                              </SelectTrigger>
                              <SelectContent>
                                {faculties.map(f => (
                                  <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">{user.status}</TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                                aria-label={`Delete ${user.name}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Bottom Actions removed as Add User is disabled for Admin */}

            </div>
          </main>
        </div>
      </div>
      {/* Manage Roles Dialog */}
      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Roles</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {rolesList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No roles available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {rolesList.map(r => (
                  <label key={r.id} className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedRoleIds.includes(r.id)} onChange={() => toggleRoleSelection(r.id)} />
                    <span className="text-sm">{displayRoleLabel(r.role_name)}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setIsManageOpen(false); setManageUserId(null); setSelectedRoleIds([]); }}>Cancel</Button>
              <Button onClick={saveManagedRoles}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
