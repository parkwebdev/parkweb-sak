import React, { useState } from 'react';
import { Camera01 as Camera, User01 as User } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export const ProfileSettings: React.FC = () => {
  const [profile, setProfile] = useState({
    name: 'Aaron Chachamovits',
    email: 'aaron@parkweb.app',
    phone: '(555) 123-4567',
  });

  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (digits.length >= 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (digits.length >= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length >= 3) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return digits;
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    handleInputChange('phone', formatted);
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h3 className="text-base lg:text-lg font-semibold text-foreground mb-1">Profile Settings</h3>
        <p className="text-sm text-muted-foreground">
          Manage your personal information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Avatar className="h-20 w-20 mx-auto sm:mx-0">
              <AvatarImage src="" />
              <AvatarFallback className="text-lg">
                <User size={32} />
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <Button variant="outline" className="w-full sm:w-auto">
                <Camera size={16} className="mr-2" />
                Change Avatar
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                JPG, GIF or PNG. Max size of 800KB.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={profile.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="w-full sm:w-auto">
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" />
          </div>
          <div className="flex justify-end">
            <Button variant="outline" className="w-full sm:w-auto">
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};