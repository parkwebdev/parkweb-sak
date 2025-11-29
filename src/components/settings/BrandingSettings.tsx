import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useOrgBranding } from '@/hooks/useOrgBranding';
import { Upload01, Trash02 } from '@untitledui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { SavedIndicator } from './SavedIndicator';

export const BrandingSettings = () => {
  const { branding, loading, uploading, uploadLogo, updateBranding, deleteLogo } = useOrgBranding();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [primaryColor, setPrimaryColor] = useState('#0066FF');
  const [secondaryColor, setSecondaryColor] = useState('#6366F1');
  const [customDomain, setCustomDomain] = useState('');
  const [hidePoweredBy, setHidePoweredBy] = useState(false);
  const [savedFields, setSavedFields] = useState<Record<string, boolean>>({});

  // Sync state with branding data when it loads
  useEffect(() => {
    if (branding) {
      setPrimaryColor(branding.primary_color || '#0066FF');
      setSecondaryColor(branding.secondary_color || '#6366F1');
      setCustomDomain(branding.custom_domain || '');
      setHidePoweredBy(branding.hide_powered_by || false);
    }
  }, [branding]);

  const showSaved = (field: string) => {
    setSavedFields(prev => ({ ...prev, [field]: true }));
    setTimeout(() => {
      setSavedFields(prev => ({ ...prev, [field]: false }));
    }, 2000);
  };

  // Auto-save color changes
  useEffect(() => {
    if (!primaryColor || primaryColor === branding?.primary_color) return;
    
    const timer = setTimeout(async () => {
      await updateBranding({ primary_color: primaryColor });
      showSaved('primaryColor');
    }, 1000);

    return () => clearTimeout(timer);
  }, [primaryColor]);

  useEffect(() => {
    if (!secondaryColor || secondaryColor === branding?.secondary_color) return;
    
    const timer = setTimeout(async () => {
      await updateBranding({ secondary_color: secondaryColor });
      showSaved('secondaryColor');
    }, 1000);

    return () => clearTimeout(timer);
  }, [secondaryColor]);

  useEffect(() => {
    if (customDomain === branding?.custom_domain) return;
    
    const timer = setTimeout(async () => {
      await updateBranding({ custom_domain: customDomain || null });
      showSaved('customDomain');
    }, 1000);

    return () => clearTimeout(timer);
  }, [customDomain]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const logoUrl = await uploadLogo(file);
    if (logoUrl) {
      await updateBranding({ logo_url: logoUrl });
    }
  };

  const handleHidePoweredByToggle = async (checked: boolean) => {
    setHidePoweredBy(checked);
    await updateBranding({ hide_powered_by: checked });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[200px]" />
        <Skeleton className="h-[200px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-sm font-semibold text-foreground">Branding</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Customize the appearance of your organization's public-facing pages
        </p>
      </div>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>
            Upload your organization's logo (max 5MB, PNG, JPG, or SVG)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {branding?.logo_url && (
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 border rounded-lg flex items-center justify-center bg-muted overflow-hidden">
                <img
                  src={branding.logo_url}
                  alt="Organization logo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={deleteLogo}
              >
                <Trash02 className="h-4 w-4 mr-2" />
                Remove Logo
              </Button>
            </div>
          )}

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload01 className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : branding?.logo_url ? 'Change Logo' : 'Upload Logo'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Colors</CardTitle>
          <CardDescription>
            Customize the primary and secondary colors for your branded pages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1"
                  placeholder="#0066FF"
                />
              </div>
              <SavedIndicator show={savedFields.primaryColor} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1"
                  placeholder="#6366F1"
                />
              </div>
              <SavedIndicator show={savedFields.secondaryColor} />
            </div>
          </div>

          <div className="pt-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div
                className="w-16 h-16 rounded-lg"
                style={{ backgroundColor: primaryColor }}
              />
              <div
                className="w-16 h-16 rounded-lg"
                style={{ backgroundColor: secondaryColor }}
              />
              <div className="text-sm text-muted-foreground">
                Preview of your brand colors
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Domain */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Domain</CardTitle>
          <CardDescription>
            Configure a custom domain for your branded chat pages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-domain">Domain</Label>
            <Input
              id="custom-domain"
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="chat.yourdomain.com"
            />
            <SavedIndicator show={savedFields.customDomain} />
            <p className="text-xs text-muted-foreground">
              Enter your custom domain without "https://" or trailing slashes
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hide Powered By */}
      <Card>
        <CardHeader>
          <CardTitle>Powered By Branding</CardTitle>
          <CardDescription>
            Remove "Powered by" branding from your public pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="hide-powered-by">Hide "Powered by" Badge</Label>
              <p className="text-sm text-muted-foreground">
                Remove attribution from your branded pages
              </p>
            </div>
            <Switch
              id="hide-powered-by"
              checked={hidePoweredBy}
              onCheckedChange={handleHidePoweredByToggle}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="text-sm text-muted-foreground">
        <p>
          Your branding settings will apply to all public-facing pages including widget embeds 
          and hosted chat pages.
        </p>
      </div>
    </div>
  );
};
