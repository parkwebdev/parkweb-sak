/**
 * @fileoverview General application settings with theme and preferences.
 * Auto-saves changes with debouncing and visual saved indicators.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { SkeletonSettingsCard } from '@/components/ui/skeleton';
import { logger } from '@/utils/logger';
import { PhoneInputField } from '@/components/ui/phone-input';

export function GeneralSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    compact_mode: false,
    default_project_view: 'dashboard',
  });
  const [company, setCompany] = useState({
    company_name: '',
    company_address: '',
    company_phone: '',
  });
  const [showSaved, setShowSaved] = useState({
    compact_mode: false,
    default_project_view: false,
    company_name: false,
    company_address: false,
    company_phone: false,
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
      // Fetch user preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching preferences:', error);
      }

      if (data) {
        setPreferences({
          compact_mode: data.compact_mode ?? false,
          default_project_view: data.default_project_view ?? 'dashboard',
        });
      }

      // Fetch company info from profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('company_name, company_address, company_phone')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        logger.error('Error fetching profile:', profileError);
      }

      if (profileData) {
        setCompany({
          company_name: profileData.company_name ?? '',
          company_address: profileData.company_address ?? '',
          company_phone: profileData.company_phone ?? '',
        });
      }
    } catch (error: unknown) {
      logger.error('Error in fetchPreferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof typeof preferences, value: boolean | string) => {
    if (!user) return;

    // Update local state immediately for responsive UI
    const prevValue = preferences[key];
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    // Apply compact mode immediately to body
    if (key === 'compact_mode') {
      document.body.classList.toggle('compact-mode', value as boolean);
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
          // Insert new record with typed payload
          const insertPayload: { user_id: string; compact_mode?: boolean; default_project_view?: string } = {
            user_id: user.id,
          };
          if (key === 'compact_mode') insertPayload.compact_mode = value as boolean;
          if (key === 'default_project_view') insertPayload.default_project_view = value as string;
          
          const result = await supabase
            .from('user_preferences')
            .insert(insertPayload);
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
      } catch (error: unknown) {
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

  const updateCompanyField = async (key: keyof typeof company, value: string) => {
    if (!user) return;

    // Update local state immediately
    const prevValue = company[key];
    setCompany({ ...company, [key]: value });

    // Clear existing timer for this field
    if (saveTimers.current[key]) {
      clearTimeout(saveTimers.current[key]);
    }

    // Debounce the save operation
    saveTimers.current[key] = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ [key]: value || null })
          .eq('user_id', user.id);

        if (error) {
          logger.error('Error updating company field:', error);
          setCompany(prev => ({ ...prev, [key]: prevValue }));
          toast.error("Update failed", {
            description: "Failed to update company information.",
          });
          return;
        }

        setShowSaved(prev => ({ ...prev, [key]: true }));
      } catch (error: unknown) {
        logger.error('Error in updateCompanyField:', error);
        setCompany(prev => ({ ...prev, [key]: prevValue }));
        toast.error("Update failed", {
          description: "Failed to update company information.",
        });
      }
    }, 1000);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonSettingsCard />
        <SkeletonSettingsCard />
      </div>
    );
  }

  return (
    <AnimatedList className="space-y-4" staggerDelay={0.1}>
      <AnimatedItem>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Company Details</CardTitle>
            <CardDescription className="text-xs">Your company information for emails and branding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="company_name" className="text-sm font-medium">Company Name</Label>
                <SavedIndicator show={showSaved.company_name} />
              </div>
              <Input
                id="company_name"
                value={company.company_name}
                onChange={(e) => updateCompanyField('company_name', e.target.value)}
                placeholder="Acme Corporation"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="company_address" className="text-sm font-medium">Company Address</Label>
                <SavedIndicator show={showSaved.company_address} />
              </div>
              <Input
                id="company_address"
                value={company.company_address}
                onChange={(e) => updateCompanyField('company_address', e.target.value)}
                placeholder="123 Main Street, Suite 100, City, State 12345"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="company_phone" className="text-sm font-medium">Company Phone</Label>
                <SavedIndicator show={showSaved.company_phone} />
              </div>
              <PhoneInputField
                name="company_phone"
                value={company.company_phone}
                onChange={(value) => updateCompanyField('company_phone', value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>

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