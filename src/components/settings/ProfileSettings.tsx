import React, { useState, useEffect, useRef } from 'react';
import { Camera01 as Camera, User01 as User } from '@untitledui/icons';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/lib/toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import { Button } from '@/components/ui/button';
import { SavedIndicator } from './SavedIndicator';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import { uploadAvatar } from '@/lib/avatar-upload';

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
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [savedFields, setSavedFields] = useState<Record<string, boolean>>({});
  const [initialProfile, setInitialProfile] = useState<typeof profile | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

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
        .maybeSingle();

      if (error) {
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

  const showSaved = (field: string) => {
    setSavedFields(prev => ({ ...prev, [field]: true }));
    setTimeout(() => {
      setSavedFields(prev => ({ ...prev, [field]: false }));
    }, 2000);
  };

  useEffect(() => {
    if (!loading && profile.display_name && !initialProfile) {
      setInitialProfile(profile);
    }
  }, [loading, profile.display_name]);

  // Auto-save display_name changes
  useEffect(() => {
    if (loading || !user || !initialProfile || !profile.display_name) return;
    if (profile.display_name === initialProfile.display_name) return;
    
    const timer = setTimeout(async () => {
      try {
        await supabase
          .from('profiles')
          .update({
            display_name: profile.display_name,
          })
          .eq('user_id', user.id);
        showSaved('display_name');
        setInitialProfile(profile);
      } catch (error) {
        console.error('Error auto-saving display name:', error);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [profile.display_name, loading, user, initialProfile]);

  // Auto-save email changes
  useEffect(() => {
    if (loading || !user || !initialProfile || !profile.email) return;
    if (profile.email === initialProfile.email) return;
    
    const timer = setTimeout(async () => {
      try {
        await supabase
          .from('profiles')
          .update({
            email: profile.email,
          })
          .eq('user_id', user.id);
        showSaved('email');
        setInitialProfile(profile);
      } catch (error) {
        console.error('Error auto-saving email:', error);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [profile.email, loading, user, initialProfile]);

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
        toast.error("Update failed", {
          description: "Failed to update your profile.",
        });
        return;
      }

      toast.success("Profile updated", {
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    
    event.target.value = '';
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", { description: "Please select an image smaller than 5MB." });
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast.error("Invalid file", { description: "Please select an image file." });
      return;
    }
    
    setAvatarUploading(true);
    
    try {
      // Upload optimized avatar (resized to 256x256, compressed to 65% WebP)
      const avatarUrl = await uploadAvatar(file, user.id);
      
      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user.id);
      
      if (updateError) throw updateError;
      
      // Update local state
      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
      setInitialProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
      
      toast.success("Avatar updated", { description: "Your profile picture has been updated." });
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error("Upload failed", { description: error.message || "Failed to upload avatar." });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!passwords.new || !passwords.confirm) {
      toast.error("Error", {
        description: "Please fill in all password fields.",
      });
      return;
    }

    if (passwords.new !== passwords.confirm) {
      toast.error("Error", {
        description: "New passwords don't match.",
      });
      return;
    }

    if (passwords.new.length < 8) {
      toast.error("Error", {
        description: "Password must be at least 8 characters long.",
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
        toast.error("Password update failed", {
          description: error.message,
        });
        return;
      }

      setPasswords({ current: '', new: '', confirm: '' });
      toast.success("Password updated", {
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
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-3 w-48 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <AnimatedList className="space-y-4" staggerDelay={0.1}>
      <AnimatedItem>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Personal Information</CardTitle>
          <CardDescription className="text-xs">
            Update your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div 
              className="relative group cursor-pointer mx-auto sm:mx-0" 
              onClick={() => !avatarUploading && avatarInputRef.current?.click()}
            >
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-sm">
                  {profile.display_name 
                    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase()
                    : <User size={24} />
                  }
                </AvatarFallback>
              </Avatar>
              {avatarUploading ? (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Camera size={20} className="text-white" />
                </div>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm text-muted-foreground">Click to upload new avatar</p>
              <p className="text-xs text-muted-foreground/60">JPG, PNG, GIF up to 5MB</p>
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
              <SavedIndicator show={savedFields.display_name} />
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
              <SavedIndicator show={savedFields.email} />
            </div>
          </div>
        </CardContent>
      </Card>
      </AnimatedItem>

      <AnimatedItem>
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
      </AnimatedItem>
    </AnimatedList>
  );
};