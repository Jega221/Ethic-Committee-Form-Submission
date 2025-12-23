import React, { useState } from 'react';
import { Search, Trash2, Shield } from 'lucide-react';

import { SidebarProvider } from '@/components/ui/sidebar';
import { SuperAdminSidebar } from '@/components/SuperAdminSidebar';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  isAdmin: boolean;
}

const initialUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john.doe@fiu.edu', role: 'Super Admin', status: '2 days ago', isAdmin: true },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@fiu.edu', role: 'Admin', status: '1 week ago', isAdmin: true },
  { id: '3', name: 'Michael Brown', email: 'michael.brown@fiu.edu', role: 'Faculty', status: '3 weeks ago', isAdmin: false },
  { id: '4', name: 'Emily White', email: 'emily.white@fiu.edu', role: 'Researcher', status: '1 month ago', isAdmin: false },
  { id: '5', name: 'David Johnson', email: 'david.johnson@fiu.edu', role: 'Admin', status: '5 days ago', isAdmin: true },
  { id: '6', name: 'Sarah Williams', email: 'sarah.williams@fiu.edu', role: 'Committee Member', status: '2 weeks ago', isAdmin: false },
];

const SuperAdminDashboard = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Researcher');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(user => user.id !== id));
  };

  const handleAddUser = () => {
    if (!newUserName || !newUserEmail) return;

    setUsers([
      ...users,
      {
        id: Date.now().toString(),
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        status: 'Just now',
        isAdmin: newUserRole === 'Admin' || newUserRole === 'Super Admin',
      },
    ]);

    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('Researcher');
    setIsAddUserOpen(false);
  };

  const getRoleBadgeVariant = (role: string) => {
    if (role === 'Super Admin') return 'destructive';
    if (role === 'Admin') return 'default';
    return 'secondary';
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-secondary/30">
        <SuperAdminSidebar />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-card border-b px-4 py-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold">User Management</h1>
                  <Badge variant="destructive" className="gap-1">
                    <Shield className="w-3 h-3" />
                    Super Admin
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Super Admin / User Management
                </p>
              </div>

              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button>Add User</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Select value={newUserRole} onValueChange={setNewUserRole}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Super Admin">Super Admin</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Faculty">Faculty</SelectItem>
                          <SelectItem value="Researcher">Researcher</SelectItem>
                          <SelectItem value="Committee Member">Committee Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddUser} className="w-full">Add User</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 max-w-7xl mx-auto p-6">
            <div className="bg-card border rounded-lg p-6">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.status}</TableCell>
                      <TableCell>
                        <button onClick={() => handleDeleteUser(user.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SuperAdminDashboard;
