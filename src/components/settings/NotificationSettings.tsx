import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { Bell02 as Bell, Mail01 as Mail, Monitor01 as Browser, File02 as FileText, Users01 as Users } from '@untitledui/icons';

interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  browser_notifications: boolean;
  onboarding_notifications: boolean;
  scope_work_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { requestBrowserNotificationPermission } = useNotifications();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotificationPreferences();
    }
  }, [user]);

  const fetchNotificationPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, create default ones
          await createDefaultPreferences();
        } else {
          console.error('Error fetching notification preferences:', error);
        }
        return;
      }

      setPreferences(data);
    } catch (error) {
      console.error('Error in fetchNotificationPreferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          email_notifications: true,
          browser_notifications: true,
          onboarding_notifications: true,
          scope_work_notifications: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating default preferences:', error);
        return;
      }

      setPreferences(data);
    } catch (error) {
      console.error('Error in createDefaultPreferences:', error);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user || !preferences) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ [key]: value })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating preference:', error);
        toast({
          title: "Update failed",
          description: "Failed to update notification preference.",
          variant: "destructive",
        });
        return;
      }

      setPreferences(prev => prev ? { ...prev, [key]: value } : null);

      // If enabling browser notifications, request permission
      if (key === 'browser_notifications' && value) {
        await requestBrowserNotificationPermission();
      }

      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      console.error('Error in updatePreference:', error);
    } finally {
      setUpdating(false);
    }
  };

  const testNotification = async () => {
    if (!preferences?.browser_notifications) {
      toast({
        title: "Browser notifications disabled",
        description: "Please enable browser notifications first.",
        variant: "destructive",
      });
      return;
    }

    if (Notification.permission !== 'granted') {
      const permission = await requestBrowserNotificationPermission();
      if (permission !== 'granted') {
        return;
      }
    }

    new Notification('Test Notification', {
      body: 'This is a test notification from Agency.',
      icon: '/favicon.ico',
    });

    toast({
      title: "Test notification sent",
      description: "Check your browser for the notification!",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground mb-4">Failed to load notification preferences.</p>
          <Button onClick={fetchNotificationPreferences}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={20} />
            General Notifications
          </CardTitle>
          <CardDescription>
            Configure how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-muted-foreground" />
                <Label htmlFor="email-notifications" className="text-base font-medium">
                  Email Notifications
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.email_notifications}
              onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
              disabled={updating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Browser size={16} className="text-muted-foreground" />
                <Label htmlFor="browser-notifications" className="text-base font-medium">
                  Browser Notifications
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Show desktop notifications in your browser
              </p>
            </div>
            <Switch
              id="browser-notifications"
              checked={preferences.browser_notifications}
              onCheckedChange={(checked) => updatePreference('browser_notifications', checked)}
              disabled={updating}
            />
          </div>

          {preferences.browser_notifications && (
            <div className="pl-6 pt-2">
              <Button variant="outline" size="sm" onClick={testNotification}>
                Test Browser Notification
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Choose which types of activities you want to be notified about
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-muted-foreground" />
                <Label htmlFor="scope-work-notifications" className="text-base font-medium">
                  Scope of Work Updates
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Get notified when scope of work status changes
              </p>
            </div>
            <Switch
              id="scope-work-notifications"
              checked={preferences.scope_work_notifications}
              onCheckedChange={(checked) => updatePreference('scope_work_notifications', checked)}
              disabled={updating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-muted-foreground" />
                <Label htmlFor="onboarding-notifications" className="text-base font-medium">
                  Client Onboarding
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Get notified about new client onboarding submissions
              </p>
            </div>
            <Switch
              id="onboarding-notifications"
              checked={preferences.onboarding_notifications}
              onCheckedChange={(checked) => updatePreference('onboarding_notifications', checked)}
              disabled={updating}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Status</CardTitle>
          <CardDescription>
            Current browser notification permission status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Browser Permission</p>
              <p className="text-sm text-muted-foreground">
                {Notification.permission === 'granted' ? 'Notifications are allowed' :
                 Notification.permission === 'denied' ? 'Notifications are blocked' :
                 'Notification permission not requested'}
              </p>
            </div>
            {Notification.permission !== 'granted' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={requestBrowserNotificationPermission}
              >
                Enable Notifications
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};