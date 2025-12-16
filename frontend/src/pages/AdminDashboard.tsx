import React, { useState } from 'react';
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

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

const initialUsers: User[] = [];

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/getData/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          // Map backend data to frontend interface
          const mappedUsers = data.map((u: any) => ({
            id: u.id.toString(),
            name: `${u.name} ${u.surname}`,
            email: u.email,
            role: u.role_name || 'User',
            status: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'
          }));
          setUsers(mappedUsers);
        }
      } catch (error) {
        console.error('Failed to fetch users', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Researcher');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
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
                <button onClick={() => setIsAddUserOpen(true)} className="bg-primary text-white px-3 py-2 rounded">Add User</button>
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
                      <SelectItem value="Faculty">Faculty</SelectItem>
                      <SelectItem value="Researcher">Researcher</SelectItem>
                      <SelectItem value="Committee Member">Committee Member</SelectItem>
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
              <div className="rounded-lg border border-border overflow-hidden">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell className="text-muted-foreground">{user.status}</TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                            aria-label={`Delete ${user.name}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6 justify-center">
                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary">Add New User</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder="Enter name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="Enter email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <Select value={newUserRole} onValueChange={setNewUserRole}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Faculty">Faculty</SelectItem>
                            <SelectItem value="Researcher">Researcher</SelectItem>
                            <SelectItem value="Committee Member">Committee Member</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleAddUser} className="w-full">
                        Add User
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
