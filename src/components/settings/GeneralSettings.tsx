import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/lib/toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SavedIndicator } from './SavedIndicator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import { LoadingState } from '@/components/ui/loading-state';
import { logger } from '@/utils/logger';

export const GeneralSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    compact_mode: false,
    default_project_view: 'dashboard',
  });
  const [showSaved, setShowSaved] = useState({
    compact_mode: false,
    default_project_view: false,
  });
  
  const saveTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          compact_mode: data.compact_mode ?? false,
          default_project_view: data.default_project_view ?? 'dashboard',
        });
      }
    } catch (error) {
      logger.error('Error in fetchPreferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof typeof preferences, value: any) => {
    if (!user) return;

    // Update local state immediately for responsive UI
    const prevValue = preferences[key];
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    // Apply compact mode immediately to body
    if (key === 'compact_mode') {
      document.body.classList.toggle('compact-mode', value);
    }

    // Clear existing timer for this field
    if (saveTimers.current[key]) {
      clearTimeout(saveTimers.current[key]);
    }

    // Debounce the save operation
    saveTimers.current[key] = setTimeout(async () => {
      try {
        // Use UPDATE instead of UPSERT to avoid duplicate key issues
        const { data: existingData } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', user.id)
          .single();

        let error;
        if (existingData) {
          // Update existing record
          const result = await supabase
            .from('user_preferences')
            .update({ [key]: value })
            .eq('user_id', user.id);
          error = result.error;
        } else {
          // Insert new record
          const result = await supabase
            .from('user_preferences')
            .insert({
              user_id: user.id,
              [key]: value,
            } as any);
          error = result.error;
        }

        if (error) {
          logger.error('Error updating preference:', error);
          // Revert local state on error
          setPreferences({ ...preferences, [key]: prevValue });
          if (key === 'compact_mode') {
            document.body.classList.toggle('compact-mode', prevValue as boolean);
          }
          toast.error("Update failed", {
            description: "Failed to update preference.",
          });
          return;
        }

        // Show saved indicator
        setShowSaved({ ...showSaved, [key]: true });
      } catch (error) {
        logger.error('Error in updatePreference:', error);
        // Revert local state on error
        setPreferences({ ...preferences, [key]: prevValue });
        if (key === 'compact_mode') {
          document.body.classList.toggle('compact-mode', prevValue as boolean);
        }
        toast.error("Update failed", {
          description: "Failed to update preference.",
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

  // Apply compact mode on load
  useEffect(() => {
    if (preferences.compact_mode) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
  }, [preferences.compact_mode]);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <AnimatedList className="space-y-4" staggerDelay={0.1}>
      <AnimatedItem>
        <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Application Preferences</CardTitle>
          <CardDescription className="text-xs">Customize your application experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Theme</label>
              </div>
              <p className="text-xs text-muted-foreground">Choose your preferred color scheme</p>
            </div>
            <ThemeToggle />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Compact Mode</label>
                <SavedIndicator show={showSaved.compact_mode} />
              </div>
              <p className="text-xs text-muted-foreground">Reduce spacing and padding for more content on screen</p>
            </div>
            <Switch
              checked={preferences.compact_mode}
              onCheckedChange={(checked) => updatePreference('compact_mode', checked)}
            />
          </div>
        </CardContent>
      </Card>
      </AnimatedItem>

      <AnimatedItem>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Default Views</CardTitle>
          <CardDescription className="text-xs">Set your preferred starting views</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Default View</Label>
                <SavedIndicator show={showSaved.default_project_view} />
              </div>
              <p className="text-xs text-muted-foreground">Choose which page loads first when opening the application</p>
            </div>
            <Select 
              value={preferences.default_project_view} 
              onValueChange={(value) => updatePreference('default_project_view', value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dashboard">Dashboard</SelectItem>
                <SelectItem value="agents">Agents</SelectItem>
                <SelectItem value="conversations">Conversations</SelectItem>
                <SelectItem value="leads">Leads</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      </AnimatedItem>

      <AnimatedItem>
      <div className="flex justify-end">
        <p className="text-xs text-muted-foreground">
          Changes are saved automatically
        </p>
      </div>
      </AnimatedItem>
    </AnimatedList>
  );
};