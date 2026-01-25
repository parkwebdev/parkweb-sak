/**
 * @fileoverview Notification preferences settings with email category controls and deep linking.
 * Manages email categories, browser, and sound notification toggles with toast auto-save feedback.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { ToggleSettingRow } from '@/components/ui/toggle-setting-row';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import { SkeletonSettingsCard } from '@/components/ui/skeleton';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';


interface NotificationPreferences {
  id: string;
  user_id: string;
  // General toggles
  email_notifications: boolean;
  browser_notifications: boolean;
  sound_notifications: boolean;
  // Category toggles (in-app/browser)
  conversation_notifications: boolean;
  lead_notifications: boolean;
  agent_notifications: boolean;
  team_notifications: boolean;
  report_notifications: boolean;
  // Email-specific category toggles
  booking_email_notifications: boolean;
  lead_email_notifications: boolean;
  team_email_notifications: boolean;
  agent_email_notifications: boolean;
  report_email_notifications: boolean;
  product_email_notifications: boolean;
  // Weekly report specific
  weekly_report_enabled: boolean;
  weekly_report_timezone: string;
  created_at: string;
  updated_at: string;
}

// Get friendly timezone label from IANA timezone
function getTimezoneLabel(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return tz.split('/').pop()?.replace(/_/g, ' ') || tz;
}

export function NotificationSettings() {
  const { user } = useAuth();
  const { requestBrowserNotificationPermission } = useNotifications();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  
  const saveTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Handle deep linking for unsubscribe URLs
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      // Slight delay to ensure DOM is ready
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Flash the section to draw attention
          element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
          }, 2000);
        }
      }, 100);
    }
  }, [loading]);

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
          logger.error('Error fetching notification preferences:', error);
        }
        return;
      }

      // Transform nullable booleans to required booleans with defaults
      setPreferences({
        ...data,
        email_notifications: data.email_notifications ?? true,
        browser_notifications: data.browser_notifications ?? true,
        sound_notifications: data.sound_notifications ?? true,
        conversation_notifications: data.conversation_notifications ?? true,
        lead_notifications: data.lead_notifications ?? true,
        agent_notifications: data.agent_notifications ?? true,
        team_notifications: data.team_notifications ?? true,
        report_notifications: data.report_notifications ?? true,
        booking_email_notifications: data.booking_email_notifications ?? true,
        lead_email_notifications: data.lead_email_notifications ?? true,
        team_email_notifications: data.team_email_notifications ?? true,
        agent_email_notifications: data.agent_email_notifications ?? true,
        report_email_notifications: data.report_email_notifications ?? true,
        product_email_notifications: data.product_email_notifications ?? true,
        weekly_report_enabled: data.weekly_report_enabled ?? true,
        weekly_report_timezone: data.weekly_report_timezone ?? 'America/New_York',
      });
    } catch (error: unknown) {
      logger.error('Error in fetchNotificationPreferences:', error);
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
          sound_notifications: true,
          conversation_notifications: true,
          lead_notifications: true,
          agent_notifications: true,
          team_notifications: true,
          report_notifications: true,
          booking_email_notifications: true,
          lead_email_notifications: true,
          team_email_notifications: true,
          agent_email_notifications: true,
          report_email_notifications: true,
          product_email_notifications: true,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating default preferences:', error);
        return;
      }

      // Transform nullable booleans to required booleans with defaults
      setPreferences({
        ...data,
        email_notifications: data.email_notifications ?? true,
        browser_notifications: data.browser_notifications ?? true,
        sound_notifications: data.sound_notifications ?? true,
        conversation_notifications: data.conversation_notifications ?? true,
        lead_notifications: data.lead_notifications ?? true,
        agent_notifications: data.agent_notifications ?? true,
        team_notifications: data.team_notifications ?? true,
        report_notifications: data.report_notifications ?? true,
        booking_email_notifications: data.booking_email_notifications ?? true,
        lead_email_notifications: data.lead_email_notifications ?? true,
        team_email_notifications: data.team_email_notifications ?? true,
        agent_email_notifications: data.agent_email_notifications ?? true,
        report_email_notifications: data.report_email_notifications ?? true,
        product_email_notifications: data.product_email_notifications ?? true,
        weekly_report_enabled: data.weekly_report_enabled ?? true,
        weekly_report_timezone: data.weekly_report_timezone ?? 'America/New_York',
      });
    } catch (error: unknown) {
      logger.error('Error in createDefaultPreferences:', error);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean | string) => {
    if (!user || !preferences) return;

    // Handle browser notification permission requests BEFORE updating state
    if (key === 'browser_notifications' && value) {
      if (!('Notification' in window)) {
        toast.error("Not supported", {
          description: "Browser notifications are not supported in this environment.",
        });
        return; // Don't update state
      }
      
      const currentPermission = Notification.permission;
      
      if (currentPermission === 'denied') {
        toast.error("Permission blocked", {
          description: "Browser notifications are blocked. Click the lock icon in your address bar to enable them.",
        });
        return; // Don't update state - toggle stays off
      }
      
      if (currentPermission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            toast.error("Permission not granted", {
              description: permission === 'denied' 
                ? "Notifications were denied. Click the lock icon in your address bar to enable them."
                : "Browser notifications require permission to be enabled.",
            });
            return; // Don't update state - toggle stays off
          }
        } catch (error: unknown) {
          logger.error('Error requesting notification permission:', error);
          toast.error("Permission request failed", {
            description: "Unable to request notification permission.",
          });
          return; // Don't update state
        }
      }
      // If we reach here, permission is 'granted' - proceed to update state
    }

    // Now update local state (only after permission checks pass for browser_notifications)
    setPreferences(prev => prev ? { ...prev, [key]: value } : null);

    // Clear existing timer for this field
    if (saveTimers.current[key]) {
      clearTimeout(saveTimers.current[key]);
    }

    // Debounce the save operation (500ms standard)
    saveTimers.current[key] = setTimeout(async () => {
      const toastId = toast.saving();
      try {
        const { error } = await supabase
          .from('notification_preferences')
          .update({ [key]: value })
          .eq('user_id', user.id);

        if (error) {
          logger.error('Error updating preference:', error);
          toast.error("Update failed", {
            description: getErrorMessage(error),
          });
        }
      } catch (error: unknown) {
        logger.error('Error in updatePreference:', error);
        toast.error("Update failed", {
          description: getErrorMessage(error),
        });
      } finally {
        toast.dismiss(toastId);
      }
    }, 500);
  };

  // Sync browser_notifications preference with actual browser permission state
  useEffect(() => {
    if (!preferences || !user) return;
    
    // If DB says enabled but browser has denied permission, sync to false
    if (preferences.browser_notifications && 'Notification' in window && Notification.permission === 'denied') {
      // Silently update the preference to match reality
      setPreferences(prev => prev ? { ...prev, browser_notifications: false } : null);
      
      // Also save to database
      supabase
        .from('notification_preferences')
        .update({ browser_notifications: false })
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) {
            logger.error('Error syncing browser notification preference:', error);
          }
        });
    }
  }, [preferences?.browser_notifications, user]);

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
      body: 'This is a test notification from Pilot.',
      icon: '/notification-icon.png?v=2',
    });

    toast.success("Test notification sent", {
      description: "Check your browser for the notification!",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonSettingsCard />
        <SkeletonSettingsCard />
        <SkeletonSettingsCard />
      </div>
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
    <AnimatedList className="space-y-6" staggerDelay={0.1}>
      {/* Email Notifications Section */}
      <AnimatedItem>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Email Notifications
            </CardTitle>
            <CardDescription className="text-sm">
              Control which types of emails you receive from Pilot
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ToggleSettingRow
              id="email-notifications"
              label="Enable Email Notifications"
              description="Receive important updates and alerts via email"
              checked={preferences.email_notifications}
              onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
            />

            {preferences.email_notifications && (
              <div className="pl-4 border-l-2 border-border space-y-6">
                <div id="booking-emails" className="transition-all duration-300 rounded-lg p-3 -m-3">
                  <ToggleSettingRow
                    id="booking-email-notifications"
                    label="Booking Emails"
                    description="Confirmations, reminders, cancellations, and reschedules"
                    checked={preferences.booking_email_notifications}
                    onCheckedChange={(checked) => updatePreference('booking_email_notifications', checked)}
                  />
                </div>

                <div id="lead-emails" className="transition-all duration-300 rounded-lg p-3 -m-3">
                  <ToggleSettingRow
                    id="lead-email-notifications"
                    label="Lead Emails"
                    description="New leads, status changes, and human takeover requests"
                    checked={preferences.lead_email_notifications}
                    onCheckedChange={(checked) => updatePreference('lead_email_notifications', checked)}
                  />
                </div>

                <div id="team-emails" className="transition-all duration-300 rounded-lg p-3 -m-3">
                  <ToggleSettingRow
                    id="team-email-notifications"
                    label="Team Emails"
                    description="Invitations and team member changes"
                    checked={preferences.team_email_notifications}
                    onCheckedChange={(checked) => updatePreference('team_email_notifications', checked)}
                  />
                </div>

                <div id="agent-emails" className="transition-all duration-300 rounded-lg p-3 -m-3">
                  <ToggleSettingRow
                    id="agent-email-notifications"
                    label="Agent Emails"
                    description="Webhook failures and agent error alerts"
                    checked={preferences.agent_email_notifications}
                    onCheckedChange={(checked) => updatePreference('agent_email_notifications', checked)}
                  />
                </div>

                <div id="report-emails" className="transition-all duration-300 rounded-lg p-3 -m-3">
                  <ToggleSettingRow
                    id="report-email-notifications"
                    label="Scheduled Report Emails"
                    description="Reports you've scheduled in the Analytics section"
                    checked={preferences.report_email_notifications}
                    onCheckedChange={(checked) => updatePreference('report_email_notifications', checked)}
                  />
                </div>

                <div id="weekly-report" className="transition-all duration-300 rounded-lg p-3 -m-3">
                  <ToggleSettingRow
                    id="weekly-report-enabled"
                    label="Weekly Analytics Digest"
                    description={`Receive a summary every Monday at 8 AM (${getTimezoneLabel()})`}
                    checked={preferences.weekly_report_enabled}
                    onCheckedChange={(checked) => {
                      updatePreference('weekly_report_enabled', checked);
                      if (checked) {
                        // Auto-detect and save timezone when enabling
                        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                        updatePreference('weekly_report_timezone', detectedTimezone);
                      }
                    }}
                  />
                </div>

                <div id="product-emails" className="transition-all duration-300 rounded-lg p-3 -m-3">
                  <ToggleSettingRow
                    id="product-email-notifications"
                    label="Product Updates"
                    description="Feature announcements and product news"
                    checked={preferences.product_email_notifications}
                    onCheckedChange={(checked) => updatePreference('product_email_notifications', checked)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedItem>

      {/* Browser & Sound Section */}
      <AnimatedItem>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Browser & Sound</CardTitle>
            <CardDescription className="text-sm">
              Configure browser notifications and audio alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <ToggleSettingRow
                  id="browser-notifications"
                  label="Browser Notifications"
                  description={
                    'Notification' in window && Notification.permission === 'denied'
                      ? "Blocked by browser. Click the lock icon in your address bar to enable."
                      : "Show desktop notifications in your browser"
                  }
                  checked={preferences.browser_notifications && ('Notification' in window ? Notification.permission === 'granted' : false)}
                  onCheckedChange={(checked) => updatePreference('browser_notifications', checked)}
                  disabled={'Notification' in window && Notification.permission === 'denied'}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={testNotification}
                disabled={!preferences.browser_notifications || ('Notification' in window && Notification.permission !== 'granted')}
              >
                Send Test
              </Button>
            </div>

            <ToggleSettingRow
              id="sound-notifications"
              label="Sound Notifications"
              description="Play a sound when new messages arrive"
              checked={preferences.sound_notifications}
              onCheckedChange={(checked) => updatePreference('sound_notifications', checked)}
            />
          </CardContent>
        </Card>
      </AnimatedItem>

      {/* In-App Notification Types */}
      <AnimatedItem>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">In-App Notifications</CardTitle>
            <CardDescription className="text-sm">
              Choose which types of activities trigger in-app and browser notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ToggleSettingRow
              id="conversation-notifications"
              label="Conversation Activity"
              description="New conversations, escalations, and takeover requests"
              checked={preferences.conversation_notifications}
              onCheckedChange={(checked) => updatePreference('conversation_notifications', checked)}
            />

            <ToggleSettingRow
              id="lead-notifications"
              label="Lead Notifications"
              description="New leads captured and lead status changes"
              checked={preferences.lead_notifications}
              onCheckedChange={(checked) => updatePreference('lead_notifications', checked)}
            />

            <ToggleSettingRow
              id="agent-notifications"
              label="Agent Alerts"
              description="Agent errors and knowledge source updates"
              checked={preferences.agent_notifications}
              onCheckedChange={(checked) => updatePreference('agent_notifications', checked)}
            />

            <ToggleSettingRow
              id="team-notifications"
              label="Team Activity"
              description="Team invitations and member updates"
              checked={preferences.team_notifications}
              onCheckedChange={(checked) => updatePreference('team_notifications', checked)}
            />

            <ToggleSettingRow
              id="report-notifications"
              label="Report Notifications"
              description="Scheduled reports and analytics alerts"
              checked={preferences.report_notifications}
              onCheckedChange={(checked) => updatePreference('report_notifications', checked)}
            />
          </CardContent>
        </Card>
      </AnimatedItem>

      {/* Browser Status */}
      <AnimatedItem>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Browser Permission Status</CardTitle>
            <CardDescription className="text-xs">
              Current browser notification permission
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Permission Status</p>
                <p className="text-xs text-muted-foreground">
                  {typeof window !== 'undefined' && 'Notification' in window
                    ? Notification.permission === 'granted'
                      ? 'Notifications are enabled'
                      : Notification.permission === 'denied'
                      ? 'Notifications are blocked. Enable in browser settings.'
                      : 'Notifications permission not requested'
                    : 'Browser notifications not supported'}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={testNotification}
                disabled={!preferences.browser_notifications}
              >
                Test Notification
              </Button>
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>
    </AnimatedList>
  );
}
