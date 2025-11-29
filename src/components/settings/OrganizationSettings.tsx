import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload01, Palette, AlertCircle, CheckCircle } from '@untitledui/icons';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CustomDomainManager } from './CustomDomainManager';
import { SavedIndicator } from './SavedIndicator';

export const OrganizationSettings = () => {
  const { organization, branding, loading, updateOrganization, updateBranding, uploadLogo } = useOrganizationSettings();
  const [orgName, setOrgName] = useState(organization?.name || '');
  const [orgSlug, setOrgSlug] = useState(organization?.slug || '');
  const [primaryColor, setPrimaryColor] = useState(branding?.primary_color || '#000000');
  const [secondaryColor, setSecondaryColor] = useState(branding?.secondary_color || '#666666');
  const [customDomain, setCustomDomain] = useState(branding?.custom_domain || '');
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [savedFields, setSavedFields] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (organization) {
      setOrgName(organization.name);
      setOrgSlug(organization.slug);
    }
  }, [organization]);

  React.useEffect(() => {
    if (branding) {
      setPrimaryColor(branding.primary_color || '#000000');
      setSecondaryColor(branding.secondary_color || '#666666');
      setCustomDomain(branding.custom_domain || '');
    }
  }, [branding]);

  const validateSlug = (slug: string): string | null => {
    if (!slug) return 'Slug is required';
    if (slug.length < 3) return 'Slug must be at least 3 characters';
    if (slug.length > 63) return 'Slug must be less than 64 characters';
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
      return 'Slug can only contain lowercase letters, numbers, and hyphens (no spaces or special characters)';
    }
    if (slug.startsWith('-') || slug.endsWith('-')) {
      return 'Slug cannot start or end with a hyphen';
    }
    return null;
  };

  const showSaved = (field: string) => {
    setSavedFields(prev => ({ ...prev, [field]: true }));
    setTimeout(() => {
      setSavedFields(prev => ({ ...prev, [field]: false }));
    }, 2000);
  };

  const handleSlugChange = async (value: string) => {
    // Auto-format: lowercase and replace invalid characters
    const formatted = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setOrgSlug(formatted);
    
    // Validate format
    const formatError = validateSlug(formatted);
    if (formatError) {
      setSlugError(formatError);
      return;
    }

    // Check uniqueness only if slug changed from original
    if (formatted !== organization?.slug && formatted.length >= 3) {
      setIsCheckingSlug(true);
      setSlugError(null);
      
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', formatted)
          .neq('id', organization?.id || '')
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setSlugError('This slug is already taken');
        } else {
          setSlugError(null);
          // Auto-save if valid
          await autoSaveSlug(formatted);
        }
      } catch (error) {
        console.error('Error checking slug:', error);
      } finally {
        setIsCheckingSlug(false);
      }
    } else {
      setSlugError(null);
    }
  };

  const autoSaveSlug = async (slug: string) => {
    if (slugError || !organization) return;
    
    try {
      await updateOrganization({ slug });
      showSaved('slug');
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        setSlugError('This slug is already taken');
        toast.error('This slug is already taken');
      }
    }
  };

  useEffect(() => {
    if (!organization || !orgName || orgName === organization?.name) return;
    
    const timer = setTimeout(async () => {
      try {
        await updateOrganization({ name: orgName });
        showSaved('name');
      } catch (error) {
        toast.error('Failed to save organization name');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [orgName, organization]);

  useEffect(() => {
    if (!branding || !primaryColor || primaryColor === branding?.primary_color) return;
    
    const timer = setTimeout(async () => {
      try {
        await updateBranding({ primary_color: primaryColor });
        showSaved('primaryColor');
      } catch (error) {
        toast.error('Failed to save primary color');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [primaryColor, branding]);

  useEffect(() => {
    if (!branding || !secondaryColor || secondaryColor === branding?.secondary_color) return;
    
    const timer = setTimeout(async () => {
      try {
        await updateBranding({ secondary_color: secondaryColor });
        showSaved('secondaryColor');
      } catch (error) {
        toast.error('Failed to save secondary color');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondaryColor, branding]);

  useEffect(() => {
    if (!branding || customDomain === branding?.custom_domain) return;
    
    const timer = setTimeout(async () => {
      try {
        await updateBranding({ custom_domain: customDomain || null });
        showSaved('customDomain');
      } catch (error) {
        toast.error('Failed to save custom domain');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [customDomain, branding]);


  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadLogo(file);
    } catch (error) {
      console.error('Error uploading logo:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Profile</CardTitle>
              <CardDescription>
                Manage your workspace's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Workspace Name</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Inc."
                />
                <SavedIndicator show={savedFields.name} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org-slug">Workspace Slug</Label>
                <div className="relative">
                  <Input
                    id="org-slug"
                    value={orgSlug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="acme-inc"
                    className={slugError ? 'border-destructive' : ''}
                  />
                  {isCheckingSlug && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {!isCheckingSlug && orgSlug && !slugError && orgSlug !== organization?.slug && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
                <SavedIndicator show={savedFields.slug} />
                {slugError && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{slugError}</AlertDescription>
                  </Alert>
                )}
                <p className="text-sm text-muted-foreground">
                  Used in hosted chat URLs: /{orgSlug}/agent-name
                </p>
                <p className="text-sm text-muted-foreground">
                  Must be unique and contain only lowercase letters, numbers, and hyphens
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Branding</CardTitle>
              <CardDescription>
                Customize your workspace's visual identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 rounded-lg">
                    <AvatarImage src={branding?.logo_url || undefined} />
                    <AvatarFallback className="rounded-lg">
                      {orgName?.charAt(0).toUpperCase() || 'O'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" asChild>
                        <span>
                          <Upload01 className="h-4 w-4 mr-2" />
                          Upload Logo
                        </span>
                      </Button>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Recommended: Square image, at least 200x200px
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <Label>Brand Colors</Label>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="primary-color"
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        placeholder="#000000"
                      />
                    </div>
                    <SavedIndicator show={savedFields.primaryColor} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="secondary-color"
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-20 h-10 cursor-pointer"
                      />
                      <Input
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        placeholder="#666666"
                      />
                    </div>
                    <SavedIndicator show={savedFields.secondaryColor} />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="custom-domain">Custom Domain</Label>
                <Input
                  id="custom-domain"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="chat.yourdomain.com"
                />
                <SavedIndicator show={savedFields.customDomain} />
                <p className="text-sm text-muted-foreground">
                  Configure a custom domain for your agent widgets
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="space-y-6">
          <CustomDomainManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
