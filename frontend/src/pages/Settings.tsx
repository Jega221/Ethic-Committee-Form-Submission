import React, { useState, useEffect } from 'react';
import { Bell, HelpCircle, User, Camera } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateProfile, changePassword, getPublicFaculties } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    firstName: '',
    surname: '',
    email: '',
    faculty: '',
    faculty_id: null as number | null,
  });

  const [editForm, setEditForm] = useState({
    name: '',
    surname: '',
    email: '',
    faculty_id: null as number | null,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [faculties, setFaculties] = useState<{ id: number; name: string }[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load user profile from localStorage on mount
  useEffect(() => {
    const loadProfile = () => {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          console.log('Loaded profile from localStorage:', parsed);
          setProfile({
            firstName: parsed.firstName || parsed.name || '',
            surname: parsed.surname || '',
            email: parsed.email || '',
            faculty: parsed.faculty || '',
            faculty_id: parsed.faculty_id || null,
          });
          // Initialize edit form
          setEditForm({
            name: parsed.firstName || parsed.name || '',
            surname: parsed.surname || '',
            email: parsed.email || '',
            faculty_id: parsed.faculty_id || null,
          });
        } catch (err) {
          console.error('Error parsing user profile:', err);
        }
      }
    };
    loadProfile();
  }, []);

  // Load faculties
  useEffect(() => {
    const loadFaculties = async () => {
      try {
        const data = await getPublicFaculties();
        setFaculties(data);
      } catch (err) {
        console.error('Failed to load faculties:', err);
      }
    };
    loadFaculties();
  }, []);

  const handleEditProfile = async () => {
    if (!editForm.name || !editForm.email) {
      toast({
        title: "Error",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Updating profile with data:', editForm);
      const response = await updateProfile({
        name: editForm.name,
        surname: editForm.surname,
        email: editForm.email,
        faculty_id: editForm.faculty_id || undefined,
      });

      console.log('Profile update response:', response);

      // Backend returns { token, user: { id, name, surname, email, ... } }
      const user = response.data?.user || response.data;
      const token = response.data?.token;

      if (token) {
        localStorage.setItem('token', token);
      }

      // Update local storage (normalize to frontend shape)
      const currentProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
      const updatedProfile = {
        ...currentProfile,
        name: user?.name || currentProfile.name || '',
        firstName: user?.name || currentProfile.firstName || '',
        surname: user?.surname || currentProfile.surname || '',
        email: user?.email || currentProfile.email || '',
        faculty_id: user?.faculty_id ?? currentProfile.faculty_id ?? null,
        faculty: user?.faculty ?? currentProfile.faculty ?? '',
      };

      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      console.log('Updated profile in localStorage:', updatedProfile);

      // Update state
      setProfile({
        firstName: updatedProfile.firstName,
        surname: updatedProfile.surname,
        email: updatedProfile.email,
        faculty: updatedProfile.faculty || '',
        faculty_id: updatedProfile.faculty_id,
      });

      // Also update edit form to reflect changes
      setEditForm({
        name: updatedProfile.firstName || updatedProfile.name,
        surname: updatedProfile.surname,
        email: updatedProfile.email,
        faculty_id: updatedProfile.faculty_id,
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      setIsEditDialogOpen(false);
    } catch (err: any) {
      console.error('Profile update error:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to update profile";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "All password fields are required",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Changing password...');
      const response = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      
      console.log('Password change response:', response);

      toast({
        title: "Success",
        description: "Password changed successfully",
      });

      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setIsPasswordDialogOpen(false);
    } catch (err: any) {
      console.error('Password change error:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.message || err.message || "Failed to change password";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

                    {/* Faculty */}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Faculty
                      </p>
                      <p className="text-base text-foreground capitalize">
                        {profile.faculty || 'Not set'}
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
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input 
                              id="firstName" 
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="surname">Surname</Label>
                            <Input 
                              id="surname" 
                              value={editForm.surname}
                              onChange={(e) => setEditForm({ ...editForm, surname: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input 
                              id="email" 
                              type="email" 
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="faculty">Faculty</Label>
                            <Select
                              value={editForm.faculty_id?.toString() || ''}
                              onValueChange={(value) => setEditForm({ ...editForm, faculty_id: value ? parseInt(value) : null })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select faculty" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {faculties.map((faculty) => (
                                  <SelectItem key={faculty.id} value={faculty.id.toString()}>
                                    {faculty.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button 
                          className="w-full mt-4" 
                          onClick={handleEditProfile}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
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
                            <Label htmlFor="currentPassword">Current Password *</Label>
                            <Input 
                              id="currentPassword" 
                              type="password" 
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password *</Label>
                            <Input 
                              id="newPassword" 
                              type="password" 
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password *</Label>
                            <Input 
                              id="confirmPassword" 
                              type="password" 
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <Button 
                          className="w-full mt-4" 
                          onClick={handleChangePassword}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Updating...' : 'Update Password'}
                        </Button>
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
