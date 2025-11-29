import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Globe01, CheckCircle, XCircle, AlertCircle, Trash02, RefreshCw01, Lightbulb01 } from '@untitledui/icons';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface CustomDomain {
  id: string;
  domain: string;
  verified: boolean;
  ssl_status: 'pending' | 'active' | 'failed';
  verification_token?: string;
  created_at: string;
  dns_configured?: boolean;
  is_primary?: boolean;
}

export const CustomDomainManager = () => {
  const { currentOrg } = useOrganization();
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');

  useEffect(() => {
    fetchDomains();
  }, [currentOrg?.id]);

  const fetchDomains = async () => {
    if (!currentOrg?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_domains')
        .select('*')
        .eq('org_id', currentOrg.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDomains((data || []).map(d => ({
        ...d,
        ssl_status: d.ssl_status as 'pending' | 'active' | 'failed',
      })));
    } catch (error) {
      console.error('Error fetching domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateDomain = (domain: string): { valid: boolean; error?: string } => {
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    
    if (!domain) {
      return { valid: false, error: 'Domain is required' };
    }
    
    if (!domainRegex.test(domain)) {
      return { valid: false, error: 'Invalid domain format' };
    }
    
    if (domain.includes('://')) {
      return { valid: false, error: 'Do not include protocol (http/https)' };
    }
    
    if (domain.includes('/')) {
      return { valid: false, error: 'Do not include path or trailing slash' };
    }
    
    return { valid: true };
  };

  const handleAddDomain = async () => {
    const validation = validateDomain(newDomain);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    if (!currentOrg?.id) return;

    setIsAdding(true);
    try {
      // Generate verification token
      const token = `lovable_verify_${Math.random().toString(36).substr(2, 16)}`;
      setVerificationToken(token);

      const { error } = await supabase
        .from('custom_domains')
        .insert({
          org_id: currentOrg.id,
          domain: newDomain,
          verification_token: token,
        });

      if (error) throw error;

      toast.success('Domain added! Please configure DNS records.');
      setNewDomain('');
      setIsAddDialogOpen(false);
      fetchDomains();
    } catch (error: any) {
      console.error('Error adding domain:', error);
      if (error.message?.includes('duplicate')) {
        toast.error('This domain is already added');
      } else {
        toast.error('Failed to add domain');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleVerifyDomain = async (domain: string) => {
    if (!currentOrg?.id) return;
    
    toast.info('Checking DNS records...');
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-custom-domain', {
        body: {
          domain,
          orgId: currentOrg.id,
        },
      });

      if (error) throw error;

      if (data.verified) {
        toast.success(data.message);
        // Update local state to show verified
        setDomains(domains.map(d => 
          d.domain === domain 
            ? { ...d, verified: true, ssl_status: data.ssl_status }
            : d
        ));
      } else {
        toast.warning(data.message);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error('Failed to verify domain. Please check your DNS records.');
    }
  };

  const handleRemoveDomain = async (domainId: string) => {
    if (!currentOrg?.id) return;
    
    try {
      const { error } = await supabase
        .from('custom_domains')
        .delete()
        .eq('id', domainId)
        .eq('org_id', currentOrg.id);

      if (error) throw error;

      toast.success('Domain removed');
      fetchDomains();
    } catch (error) {
      console.error('Error removing domain:', error);
      toast.error('Failed to remove domain');
    }
  };

  const getDNSInstructions = (domain: CustomDomain) => [
    {
      type: 'A',
      name: '@',
      value: '185.158.133.1',
      description: 'Points your root domain to our servers',
    },
    {
      type: 'A',
      name: 'www',
      value: '185.158.133.1',
      description: 'Points www subdomain to our servers',
    },
    {
      type: 'TXT',
      name: '_lovable-verification',
      value: domain.verification_token || 'lovable_verify_xxx',
      description: 'Verifies domain ownership',
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground">Loading domains...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe01 className="h-5 w-5" />
                Custom Domains
              </CardTitle>
              <CardDescription>
                Add your own domain for hosted chat pages
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Domain
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Custom Domain</DialogTitle>
                  <DialogDescription>
                    Add a custom domain to use for your hosted chat pages
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="domain">Domain Name</Label>
                    <Input
                      id="domain"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value.toLowerCase())}
                      placeholder="chat.yourdomain.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your domain without http:// or https://
                    </p>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      After adding, you'll need to configure DNS records at your domain provider
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddDomain} disabled={isAdding}>
                      {isAdding ? 'Adding...' : 'Add Domain'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {domains.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe01 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No custom domains configured</p>
              <p className="text-xs mt-1">Add a domain to use your own URL for hosted chats</p>
            </div>
          ) : (
            domains.map((domain) => (
              <Card key={domain.id} className="bg-muted/50">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{domain.domain}</span>
                        {domain.verified ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Pending Verification
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>SSL: {domain.ssl_status}</span>
                        {domain.ssl_status === 'active' && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                        {domain.ssl_status === 'failed' && (
                          <XCircle className="h-3 w-3 text-destructive" />
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!domain.verified && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerifyDomain(domain.domain)}
                        >
                          <RefreshCw01 className="h-4 w-4 mr-2" />
                          Verify
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveDomain(domain.id)}
                      >
                        <Trash02 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {!domain.verified && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-medium">DNS Configuration Required</p>
                          <p className="text-xs">Add these records at your domain provider:</p>
                          <div className="mt-2 space-y-2">
                            {getDNSInstructions(domain).map((record, idx) => (
                              <div key={idx} className="bg-background p-2 rounded text-xs font-mono">
                                <div className="flex justify-between mb-1">
                                  <span className="font-semibold">{record.type}</span>
                                  <span className="text-muted-foreground">{record.description}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-muted-foreground">Name: </span>
                                    {record.name}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Value: </span>
                                    {record.value}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            DNS changes can take up to 48 hours to propagate. Click "Verify" to check status.
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <Alert>
        <Lightbulb01 className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium mb-1">Custom Domain Benefits</p>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li>Use your own branded URL for hosted chat pages</li>
            <li>Automatic SSL certificate provisioning</li>
            <li>Better trust and recognition from users</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};
