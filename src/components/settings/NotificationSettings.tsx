import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { SavedIndicator } from './SavedIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import { LoadingState } from '@/components/ui/loading-state';


interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  browser_notifications: boolean;
  conversation_notifications: boolean;
  lead_notifications: boolean;
  agent_notifications: boolean;
  team_notifications: boolean;
  report_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const { requestBrowserNotificationPermission } = useNotifications();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSaved, setShowSaved] = useState<{ [key: string]: boolean }>({});
  
  const saveTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

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
          conversation_notifications: true,
          lead_notifications: true,
          agent_notifications: true,
          team_notifications: true,
          report_notifications: true,
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

    // Update local state immediately
    setPreferences(prev => prev ? { ...prev, [key]: value } : null);

    // Handle browser notification permission requests
    if (key === 'browser_notifications' && value) {
      if (!('Notification' in window)) {
        toast.error("Not supported", {
          description: "Browser notifications are not supported in this environment.",
        });
        return;
      }
      
      const currentPermission = Notification.permission;
      
      if (currentPermission === 'denied') {
        toast.error("Permission blocked", {
          description: "Browser notifications are blocked. Please enable them in your browser settings and refresh the page.",
        });
        return;
      }
      
      if (currentPermission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            let description = "Browser notifications require permission to be enabled.";
            if (permission === 'denied') {
              description = "Notifications were denied. Please enable them in your browser settings and refresh the page.";
            }
            toast.error("Permission not granted", {
              description,
            });
            return;
          }
        } catch (error) {
          console.error('Error requesting notification permission:', error);
          toast.error("Permission request failed", {
            description: "Unable to request notification permission. Please enable notifications manually in your browser settings.",
          });
          return;
        }
      }
    }

    // Clear existing timer for this field
    if (saveTimers.current[key]) {
      clearTimeout(saveTimers.current[key]);
    }

    // Debounce the save operation
    saveTimers.current[key] = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('notification_preferences')
          .update({ [key]: value })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating preference:', error);
        toast.error("Update failed", {
          description: "Failed to update notification preference.",
        });
          return;
        }

        // Show saved indicator
        setShowSaved(prev => ({ ...prev, [key]: true }));
      } catch (error) {
        console.error('Error in updatePreference:', error);
          toast.error("Update failed", {
            description: "Failed to update notification preference.",
          });
      }
    }, 1000);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const testNotification = async () => {
    if (!('Notification' in window)) {
      toast.error("Not supported", {
        description: "Browser notifications are not supported in this environment.",
      });
      return;
    }

    if (!preferences?.browser_notifications) {
      toast.error("Browser notifications disabled", {
        description: "Please enable browser notifications first.",
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

    toast.success("Test notification sent", {
      description: "Check your browser for the notification!",
    });
  };

  if (loading) {
    return <LoadingState />;
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
    <AnimatedList className="space-y-6" staggerDelay={0.1}>
      <AnimatedItem>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">
            General Notifications
          </CardTitle>
          <CardDescription className="text-xs">
            Configure how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="email-notifications" className="text-sm font-medium">
                  Email Notifications
                </Label>
                <SavedIndicator show={showSaved.email_notifications} />
              </div>
              <p className="text-xs text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={preferences.email_notifications}
              onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="browser-notifications" className="text-sm font-medium">
                  Browser Notifications
                </Label>
                <SavedIndicator show={showSaved.browser_notifications} />
              </div>
              <p className="text-xs text-muted-foreground">
                Show desktop notifications in your browser
              </p>
            </div>
            <Switch
              id="browser-notifications"
              checked={preferences.browser_notifications}
              onCheckedChange={(checked) => updatePreference('browser_notifications', checked)}
            />
          </div>

        </CardContent>
      </Card>
      </AnimatedItem>

      <AnimatedItem>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Notification Types</CardTitle>
          <CardDescription className="text-xs">
            Choose which types of activities you want to be notified about
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="conversation-notifications" className="text-sm font-medium">
                  Conversation Activity
                </Label>
                <SavedIndicator show={showSaved.conversation_notifications} />
              </div>
              <p className="text-xs text-muted-foreground">
                New conversations, escalations, and takeover requests
              </p>
            </div>
            <Switch
              id="conversation-notifications"
              checked={preferences.conversation_notifications}
              onCheckedChange={(checked) => updatePreference('conversation_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="lead-notifications" className="text-sm font-medium">
                  Lead Notifications
                </Label>
                <SavedIndicator show={showSaved.lead_notifications} />
              </div>
              <p className="text-xs text-muted-foreground">
                New leads captured and lead status changes
              </p>
            </div>
            <Switch
              id="lead-notifications"
              checked={preferences.lead_notifications}
              onCheckedChange={(checked) => updatePreference('lead_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="agent-notifications" className="text-sm font-medium">
                  Agent Alerts
                </Label>
                <SavedIndicator show={showSaved.agent_notifications} />
              </div>
              <p className="text-xs text-muted-foreground">
                Agent errors and knowledge source updates
              </p>
            </div>
            <Switch
              id="agent-notifications"
              checked={preferences.agent_notifications}
              onCheckedChange={(checked) => updatePreference('agent_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="team-notifications" className="text-sm font-medium">
                  Team Activity
                </Label>
                <SavedIndicator show={showSaved.team_notifications} />
              </div>
              <p className="text-xs text-muted-foreground">
                Team invitations and member updates
              </p>
            </div>
            <Switch
              id="team-notifications"
              checked={preferences.team_notifications}
              onCheckedChange={(checked) => updatePreference('team_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="report-notifications" className="text-sm font-medium">
                  Report Notifications
                </Label>
                <SavedIndicator show={showSaved.report_notifications} />
              </div>
              <p className="text-xs text-muted-foreground">
                Scheduled reports and analytics alerts
              </p>
            </div>
            <Switch
              id="report-notifications"
              checked={preferences.report_notifications}
              onCheckedChange={(checked) => updatePreference('report_notifications', checked)}
            />
          </div>
        </CardContent>
      </Card>
      </AnimatedItem>

      <AnimatedItem>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Notification Status</CardTitle>
          <CardDescription className="text-xs">
            Current browser notification permission status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Browser Permission</p>
              <p className="text-xs text-muted-foreground">
                {!('Notification' in window) ? 'Notifications not supported in this environment' :
                 Notification.permission === 'granted' ? 'Notifications are allowed' :
                 Notification.permission === 'denied' ? 'Notifications are blocked' :
                 'Notification permission not requested'}
              </p>
            </div>
          {('Notification' in window) && Notification.permission !== 'granted' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                try {
                  const permission = await Notification.requestPermission();
                  if (permission === 'granted') {
                    toast.success("Notifications enabled", {
                      description: "You will now receive browser notifications.",
                    });
                  } else {
                    toast.error("Permission denied", {
                      description: "Browser notifications were not enabled.",
                    });
                  }
                } catch (error) {
                  console.error('Notification permission error:', error);
                  toast.error("Error", {
                    description: "Failed to request notification permission.",
                  });
                }
              }}
            >
              Enable Notifications
            </Button>
          )}
          {('Notification' in window) && Notification.permission === 'granted' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testNotification}
            >
              Test Notification
            </Button>
          )}
          </div>
        </CardContent>
      </Card>
      </AnimatedItem>
    </AnimatedList>
  );
};