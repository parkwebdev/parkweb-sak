import React, { useState, useEffect } from 'react';
import { Camera01 as Camera, User01 as User } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';

export const ProfileSettings: React.FC = () => {
  const [profile, setProfile] = useState({
    display_name: '',
    email: '',
    avatar_url: '',
  });
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile({
          display_name: data.display_name || '',
          email: data.email || user.email || '',
          avatar_url: data.avatar_url || '',
        });
      } else {
        // Create profile if it doesn't exist
        setProfile({
          display_name: '',
          email: user.email || '',
          avatar_url: '',
        });
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: profile.display_name,
          email: profile.email,
          avatar_url: profile.avatar_url,
        });

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Update failed",
          description: "Failed to update your profile.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error('Error in handleSave:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field: keyof typeof passwords, value: string) => {
    setPasswords(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordUpdate = async () => {
    if (!passwords.new || !passwords.confirm) {
      toast({
        title: "Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Error",
        description: "New passwords don't match.",
        variant: "destructive",
      });
      return;
    }

    if (passwords.new.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) {
        console.error('Error updating password:', error);
        toast({
          title: "Password update failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setPasswords({ current: '', new: '', confirm: '' });
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
    } catch (error) {
      console.error('Error in handlePasswordUpdate:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Personal Information</CardTitle>
          <CardDescription className="text-xs">
            Update your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Avatar className="h-16 w-16 mx-auto sm:mx-0">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-sm">
                {profile.display_name 
                  ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase()
                  : <User size={24} />
                }
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Camera size={14} className="mr-2" />
                Change Avatar
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                JPG, GIF or PNG. Max size of 800KB.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
              <Label htmlFor="display_name" className="text-xs">Display Name</Label>
              <Input
                id="display_name"
                value={profile.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                disabled={updating}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
              <Label htmlFor="email" className="text-xs">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={updating}
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} size="sm" disabled={updating}>
              {updating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Account Security</CardTitle>
          <CardDescription className="text-xs">
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="current-password" className="text-xs">Current Password</Label>
            <Input 
              id="current-password" 
              type="password" 
              value={passwords.current}
              onChange={(e) => handlePasswordChange('current', e.target.value)}
              disabled={updating}
              className="text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-xs">New Password</Label>
            <Input 
              id="new-password" 
              type="password" 
              value={passwords.new}
              onChange={(e) => handlePasswordChange('new', e.target.value)}
              disabled={updating}
              className="text-sm"
            />
            <PasswordStrengthIndicator password={passwords.new} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className="text-xs">Confirm New Password</Label>
            <Input 
              id="confirm-password" 
              type="password" 
              value={passwords.confirm}
              onChange={(e) => handlePasswordChange('confirm', e.target.value)}
              disabled={updating}
              className="text-sm"
            />
            {passwords.confirm && passwords.new !== passwords.confirm && (
              <p className="text-xs text-destructive">Passwords don't match</p>
            )}
            {passwords.confirm && passwords.new === passwords.confirm && passwords.new && (
              <p className="text-xs text-green-600 dark:text-green-500">Passwords match</p>
            )}
          </div>
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePasswordUpdate}
              disabled={updating || !passwords.new || !passwords.confirm || passwords.new !== passwords.confirm}
            >
              {updating ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};