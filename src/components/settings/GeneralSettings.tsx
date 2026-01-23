/**
 * @fileoverview General application settings with theme and preferences.
 * Silent auto-save with 500ms debouncing with toast feedback.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/lib/toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useAccountOwnerId } from '@/hooks/useAccountOwnerId';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import { SkeletonSettingsCard } from '@/components/ui/skeleton';
import { logger } from '@/utils/logger';
import { PhoneInputField } from '@/components/ui/phone-input';
import { getErrorMessage } from '@/types/errors';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from '@untitledui/icons';

export function GeneralSettings() {
  const { user } = useAuth();
  const { accountOwnerId, isImpersonating, loading: accountOwnerLoading } = useAccountOwnerId();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    default_project_view: 'dashboard',
  });
  const [company, setCompany] = useState({
    company_name: '',
    company_address: '',
    company_phone: '',
  });
  
  const saveTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Fetch data using accountOwnerId for proper impersonation support
  useEffect(() => {
    if (accountOwnerId && !accountOwnerLoading) {
      fetchPreferences();
    }
  }, [accountOwnerId, accountOwnerLoading]);

  const fetchPreferences = async () => {
    if (!accountOwnerId) return;

    try {
      // Fetch user preferences for the account owner
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', accountOwnerId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching preferences:', error);
      }

      if (data) {
        setPreferences({
          default_project_view: data.default_project_view ?? 'dashboard',
        });
      }

      // Fetch company info from profile for the account owner
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('company_name, company_address, company_phone')
        .eq('user_id', accountOwnerId)
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

  const updatePreference = async (key: keyof typeof preferences, value: string) => {
    if (!accountOwnerId || isImpersonating) return; // Block writes when impersonating

    // Update local state immediately for responsive UI
    const prevValue = preferences[key];
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    // Clear existing timer for this field
    if (saveTimers.current[key]) {
      clearTimeout(saveTimers.current[key]);
    }

    // Debounce the save operation (500ms standard)
    saveTimers.current[key] = setTimeout(async () => {
      const toastId = toast.saving();
      try {
        // Use user.id for write operations (should be blocked when impersonating anyway)
        const { data: existingData } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', user!.id)
          .single();

        let error;
        if (existingData) {
          // Update existing record
          const result = await supabase
            .from('user_preferences')
            .update({ [key]: value })
            .eq('user_id', user!.id);
          error = result.error;
        } else {
          // Insert new record
          const insertPayload: { user_id: string; default_project_view?: string } = {
            user_id: user!.id,
          };
          if (key === 'default_project_view') insertPayload.default_project_view = value;
          
          const result = await supabase
            .from('user_preferences')
            .insert(insertPayload);
          error = result.error;
        }

        if (error) {
          logger.error('Error updating preference:', error);
          // Revert local state on error
          setPreferences({ ...preferences, [key]: prevValue });
          toast.error("Update failed", {
            description: getErrorMessage(error),
          });
        }
      } catch (error: unknown) {
        logger.error('Error in updatePreference:', error);
        // Revert local state on error
        setPreferences({ ...preferences, [key]: prevValue });
        toast.error("Update failed", {
          description: getErrorMessage(error),
        });
      } finally {
        toast.dismiss(toastId);
      }
    }, 500);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  const updateCompanyField = async (key: keyof typeof company, value: string) => {
    if (!accountOwnerId || isImpersonating) return; // Block writes when impersonating

    // Update local state immediately
    const prevValue = company[key];
    setCompany({ ...company, [key]: value });

    // Clear existing timer for this field
    if (saveTimers.current[key]) {
      clearTimeout(saveTimers.current[key]);
    }

    // Debounce the save operation (500ms standard)
    saveTimers.current[key] = setTimeout(async () => {
      const toastId = toast.saving();
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ [key]: value || null })
          .eq('user_id', user!.id);

        if (error) {
          logger.error('Error updating company field:', error);
          setCompany(prev => ({ ...prev, [key]: prevValue }));
          toast.error("Update failed", {
            description: getErrorMessage(error),
          });
        }
      } catch (error: unknown) {
        logger.error('Error in updateCompanyField:', error);
        setCompany(prev => ({ ...prev, [key]: prevValue }));
        toast.error("Update failed", {
          description: getErrorMessage(error),
        });
      } finally {
        toast.dismiss(toastId);
      }
    }, 500);
  };

  if (loading || accountOwnerLoading) {
    return (
      <div className="space-y-4">
        <SkeletonSettingsCard />
        <SkeletonSettingsCard />
      </div>
    );
  }

  // Read-only mode when impersonating
  const isReadOnly = isImpersonating;

  return (
    <AnimatedList className="space-y-4" staggerDelay={0.1}>
      {isReadOnly && (
        <AnimatedItem>
          <Alert variant="default" className="border-warning/50 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning-foreground">
              You are viewing this account's settings. Editing is disabled during impersonation.
            </AlertDescription>
          </Alert>
        </AnimatedItem>
      )}
      <AnimatedItem>
        <Card>
        <CardHeader>
            <CardTitle className="text-base font-semibold">Company Details</CardTitle>
            <CardDescription className="text-sm">Your company information for emails and branding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name" className="text-sm font-medium">Company Name</Label>
              <Input
                id="company_name"
                value={company.company_name}
                onChange={(e) => updateCompanyField('company_name', e.target.value)}
                placeholder="Acme Corporation"
                disabled={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_address" className="text-sm font-medium">Company Address</Label>
              <Input
                id="company_address"
                value={company.company_address}
                onChange={(e) => updateCompanyField('company_address', e.target.value)}
                placeholder="123 Main Street, Suite 100, City, State 12345"
                disabled={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_phone" className="text-sm font-medium">Company Phone</Label>
              <div className={isReadOnly ? 'pointer-events-none opacity-50' : ''}>
                <PhoneInputField
                  name="company_phone"
                  value={company.company_phone}
                  onChange={(value) => updateCompanyField('company_phone', value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Application Preferences</CardTitle>
          <CardDescription className="text-sm">Customize your application experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Theme</label>
              <p className="text-xs text-muted-foreground">Choose your preferred color scheme</p>
            </div>
            <ThemeToggle />
          </div>

        </CardContent>
      </Card>
      </AnimatedItem>

      <AnimatedItem>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Default Views</CardTitle>
          <CardDescription className="text-sm">Set your preferred starting views</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label className="text-sm font-medium">Default View</Label>
              <p className="text-xs text-muted-foreground">Choose which page loads first when opening the application</p>
            </div>
            <Select 
              value={preferences.default_project_view} 
              onValueChange={(value) => updatePreference('default_project_view', value)}
              disabled={isReadOnly}
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
}
