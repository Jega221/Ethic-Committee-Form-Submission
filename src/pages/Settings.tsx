import React, { useState } from 'react';
import { Bell, HelpCircle, User, Camera } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Settings = () => {
  // This will be replaced with actual user data from authentication
  const [profile, setProfile] = useState({
    firstName: '',
    surname: '',
    email: '',
    studentId: '',
    dateOfBirth: '',
    department: '',
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-secondary/30">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 py-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="p-2 hover:bg-accent rounded-lg transition-colors" />
                <h1 className="text-base font-normal text-foreground hidden sm:block">
                  Final International University Ethic committee
                </h1>
              </div>
              
              <button className="relative p-2 hover:bg-accent rounded-lg transition-colors">
                <Bell className="w-6 h-6 text-foreground" />
                <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  1
                </span>
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Settings
            </h2>

            {/* Profile Information Card */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Profile Information
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your personal information and account details
                </p>
              </div>

              <div className="flex flex-col lg:flex-row gap-8">
                {/* Avatar Section */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <Avatar className="w-24 h-24 bg-secondary">
                      <AvatarFallback className="bg-secondary">
                        <User className="w-12 h-12 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <button className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 shadow-lg hover:bg-primary/90 transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Profile Details Grid */}
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        First Name
                      </p>
                      <p className="text-base text-foreground">
                        {profile.firstName || 'Not set'}
                      </p>
                    </div>

                    {/* Surname */}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Surname
                      </p>
                      <p className="text-base text-foreground">
                        {profile.surname || 'Not set'}
                      </p>
                    </div>

                    {/* Email */}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Email
                      </p>
                      <p className="text-base text-foreground">
                        {profile.email || 'Not set'}
                      </p>
                    </div>

                    {/* Student ID */}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Student ID
                      </p>
                      <p className="text-base text-foreground">
                        {profile.studentId || 'Not set'}
                      </p>
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Date of Birth
                      </p>
                      <p className="text-base text-foreground">
                        {profile.dateOfBirth || 'Not set'}
                      </p>
                    </div>

                    {/* Department */}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Department
                      </p>
                      <p className="text-base text-foreground">
                        {profile.department || 'Not set'}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 mt-8">
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">Edit Profile</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Profile</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" defaultValue={profile.firstName} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="surname">Surname</Label>
                            <Input id="surname" defaultValue={profile.surname} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" defaultValue={profile.email} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="studentId">Student ID</Label>
                            <Input id="studentId" defaultValue={profile.studentId} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Input id="dob" defaultValue={profile.dateOfBirth} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="department">Department</Label>
                            <Input id="department" defaultValue={profile.department} />
                          </div>
                        </div>
                        <Button className="w-full mt-4">Save Changes</Button>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">Change Password</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Password</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input id="currentPassword" type="password" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input id="newPassword" type="password" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input id="confirmPassword" type="password" />
                          </div>
                        </div>
                        <Button className="w-full mt-4">Update Password</Button>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Help Button */}
          <button className="fixed bottom-8 right-8 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary/90 transition-colors">
            <HelpCircle className="w-6 h-6" />
          </button>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Settings;
