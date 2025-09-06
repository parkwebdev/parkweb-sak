import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const GeneralSettings: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [preferences, setPreferences] = useState({
    auto_save: true,
    compact_mode: false,
    default_project_view: 'dashboard',
  });

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
        console.error('Error fetching preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          auto_save: data.auto_save ?? true,
          compact_mode: data.compact_mode ?? false,
          default_project_view: data.default_project_view ?? 'dashboard',
        });
      }
    } catch (error) {
      console.error('Error in fetchPreferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof typeof preferences, value: any) => {
    if (!user) return;

    // Update local state immediately for responsive UI
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    // Apply compact mode immediately to body
    if (key === 'compact_mode') {
      document.body.classList.toggle('compact-mode', value);
    }

    setUpdating(true);
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
        console.error('Error updating preference:', error);
        // Revert local state on error
        setPreferences(preferences);
        if (key === 'compact_mode') {
          document.body.classList.toggle('compact-mode', preferences.compact_mode);
        }
        toast({
          title: "Update failed",
          description: "Failed to update preference.",
          variant: "destructive",
        });
        return;
      }

      // Show success toast with specific messaging
      const messages = {
        auto_save: value ? "Auto-save enabled" : "Auto-save disabled",
        compact_mode: value ? "Compact mode enabled" : "Compact mode disabled", 
        default_project_view: `Default view set to ${value}`,
      };

      toast({
        title: messages[key as keyof typeof messages] || "Setting updated",
        description: value ? "Your preference has been saved." : "Your preference has been updated.",
      });
    } catch (error) {
      console.error('Error in updatePreference:', error);
      // Revert local state on error
      setPreferences(preferences);
      if (key === 'compact_mode') {
        document.body.classList.toggle('compact-mode', preferences.compact_mode);
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
        } as any);

      if (error) {
        console.error('Error saving preferences:', error);
        toast({
          title: "Save failed",
          description: "Failed to save your preferences.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Settings saved",
        description: "Your general settings have been updated.",
      });
    } catch (error) {
      console.error('Error in handleSave:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Apply compact mode on load
  useEffect(() => {
    if (preferences.compact_mode) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
  }, [preferences.compact_mode]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-4 py-8">
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-12 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Auto-save</label>
              <p className="text-xs text-muted-foreground">Automatically save changes as you work (saves every 30 seconds)</p>
            </div>
            <Switch
              checked={preferences.auto_save}
              onCheckedChange={(checked) => updatePreference('auto_save', checked)}
              disabled={updating}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Compact Mode</label>
              <p className="text-xs text-muted-foreground">Reduce spacing and padding for more content on screen</p>
            </div>
            <Switch
              checked={preferences.compact_mode}
              onCheckedChange={(checked) => updatePreference('compact_mode', checked)}
              disabled={updating}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Default Views</CardTitle>
          <CardDescription className="text-xs">Set your preferred starting views</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Default Project View</Label>
              <p className="text-xs text-muted-foreground">Choose which page loads first when opening the application</p>
            </div>
            <Select 
              value={preferences.default_project_view} 
              onValueChange={(value) => updatePreference('default_project_view', value)}
              disabled={updating}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dashboard">Dashboard</SelectItem>
                <SelectItem value="onboarding">Client Onboarding</SelectItem>
                <SelectItem value="scope-works">Scope of Works</SelectItem>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <p className="text-xs text-muted-foreground">
          Changes are saved automatically
        </p>
      </div>
    </div>
  );
};