import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/lib/toast';
import { Plus, Globe01, CheckCircle, AlertCircle, Trash02, Star01, RefreshCw01, Link03 } from '@untitledui/icons';
import { CopyButton } from '@/components/ui/copy-button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCustomDomains } from '@/hooks/useCustomDomains';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LoadingState } from '@/components/ui/loading-state';
import { Spinner } from '@/components/ui/spinner';

export const CustomDomainManager = () => {
  const { domains, loading, verifying, addDomain, verifyDomain, removeDomain, setPrimaryDomain } = useCustomDomains();
  const [newDomain, setNewDomain] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const validateDomain = (domain: string): boolean => {
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    
    if (!domain) return false;
    if (!domainRegex.test(domain)) return false;
    if (domain.includes('://')) return false;
    if (domain.includes('/')) return false;
    
    return true;
  };

  const handleAddDomain = async () => {
    const cleanDomain = newDomain.toLowerCase().trim();
    
    if (!validateDomain(cleanDomain)) {
      toast.error('Please enter a valid domain name');
      return;
    }

    await addDomain(cleanDomain);
    setNewDomain('');
    setIsDialogOpen(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getSSLStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="gap-1 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"><CheckCircle className="w-3 h-3" /> SSL Active</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><RefreshCw01 className="w-3 h-3 animate-spin" /> Provisioning</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> SSL Failed</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><AlertCircle className="w-3 h-3" /> Pending</Badge>;
    }
  };

  const getVerificationStatusBadge = (verified: boolean, dnsConfigured: boolean | null) => {
    if (verified) {
      return <Badge className="gap-1 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"><CheckCircle className="w-3 h-3" /> Verified</Badge>;
    }
    if (dnsConfigured === false) {
      return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> DNS Not Configured</Badge>;
    }
    return <Badge variant="secondary" className="gap-1"><AlertCircle className="w-3 h-3" /> Pending Verification</Badge>;
  };

  const getDNSInstructions = (domain: string, verificationToken: string) => {
    return [
      {
        type: 'A',
        name: '@',
        value: '185.158.133.1',
        ttl: '3600',
        description: 'Points your root domain to our servers'
      },
      {
        type: 'A',
        name: 'www',
        value: '185.158.133.1',
        ttl: '3600',
        description: 'Points www subdomain to our servers'
      },
      {
        type: 'TXT',
        name: '_verification',
        value: verificationToken,
        ttl: '3600',
        description: 'Verifies domain ownership'
      }
    ];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe01 className="w-5 h-5" />
              Custom Domains
            </CardTitle>
            <CardDescription>
              Connect your own domain for hosted chat interfaces
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                Add Domain
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Domain</DialogTitle>
                <DialogDescription>
                  Enter your domain name to get started with DNS configuration
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Input
                    placeholder="example.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter your root domain (e.g., example.com) without http:// or www
                  </p>
                </div>
                <Button onClick={handleAddDomain} className="w-full">
                  Add Domain
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <LoadingState size="lg" className="py-8" />
        ) : domains.length === 0 ? (
          <Alert>
            <Globe01 className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">No custom domains configured</p>
              <p className="text-sm">
                Add a custom domain to host your chat interfaces on your own branded URL.
                Once configured, your agents will be accessible at your domain instead of the default subdomain.
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {domains.map((domain) => (
              <Card key={domain.id} className="border-2">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Globe01 className="w-5 h-5 text-primary" />
                          <span className="font-semibold text-lg">{domain.domain}</span>
                          {domain.is_primary && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Star01 className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                </TooltipTrigger>
                                <TooltipContent>Primary domain</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getVerificationStatusBadge(domain.verified, domain.dns_configured)}
                          {getSSLStatusBadge(domain.ssl_status)}
                          {domain.verified && (
                            <Badge variant="outline" className="gap-1">
                              <Link03 className="w-3 h-3" />
                              <a 
                                href={`https://${domain.domain}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                Visit
                              </a>
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!domain.verified && (
                          <Button
                            size="sm"
                            onClick={() => verifyDomain(domain.id, domain.domain)}
                            disabled={verifying === domain.id}
                          >
                            {verifying === domain.id ? (
                              <>
                                <RefreshCw01 className="w-4 h-4 mr-2 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Verify
                              </>
                            )}
                          </Button>
                        )}
                        {domain.verified && !domain.is_primary && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPrimaryDomain(domain.id)}
                          >
                            <Star01 className="w-4 h-4 mr-2" />
                            Set Primary
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeDomain(domain.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    {!domain.verified && (
                      <>
                        <Separator />
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-4">
                              <div>
                                <p className="font-semibold mb-2">Step 1: Configure DNS Records</p>
                                <p className="text-sm text-muted-foreground mb-3">
                                  Add these DNS records at your domain provider (e.g., Cloudflare, Namecheap, GoDaddy):
                                </p>
                              </div>
                              
                              <div className="space-y-3">
                                {getDNSInstructions(domain.domain, domain.verification_token).map((record, idx) => (
                                  <div key={idx} className="bg-muted/50 rounded-lg p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-sm">{record.type} Record</span>
                                      <CopyButton content={record.value} showToast={true} toastMessage={`${record.type} record copied to clipboard`} />
                                    </div>
                                    <div className="grid grid-cols-[80px_1fr] gap-2 text-sm font-mono">
                                      <span className="text-muted-foreground">Type:</span>
                                      <span>{record.type}</span>
                                      <span className="text-muted-foreground">Name:</span>
                                      <span>{record.name}</span>
                                      <span className="text-muted-foreground">Value:</span>
                                      <span className="break-all">{record.value}</span>
                                      <span className="text-muted-foreground">TTL:</span>
                                      <span>{record.ttl} (or Auto)</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground italic">{record.description}</p>
                                  </div>
                                ))}
                              </div>

                              <div className="pt-2">
                                <p className="font-semibold text-sm mb-1">Step 2: Wait for DNS Propagation</p>
                                <p className="text-xs text-muted-foreground">
                                  DNS changes typically take 5-30 minutes but can take up to 24-48 hours.
                                  You can check propagation status at{' '}
                                  <a 
                                    href={`https://dnschecker.org/#A/${domain.domain}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    dnschecker.org
                                  </a>
                                </p>
                              </div>

                              <div className="pt-2">
                                <p className="font-semibold text-sm mb-1">Step 3: Verify Domain</p>
                                <p className="text-xs text-muted-foreground">
                                  Once DNS records are configured and propagated, click the "Verify" button above.
                                  SSL certificates will be automatically provisioned after verification.
                                </p>
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      </>
                    )}

                    {domain.verified && domain.ssl_status === 'active' && (
                      <Alert className="bg-green-500/5 border-green-500/20">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertDescription>
                          <p className="font-medium text-green-700 dark:text-green-400">Domain is live!</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Your domain is verified and secured with SSL. Your agents can now be accessed at this domain.
                          </p>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Alert>
          <Globe01 className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-1">About Custom Domains</p>
            <p className="text-sm">
              Custom domains provide a professional, branded experience for your chat interfaces.
              Once verified, agents will be accessible at your domain with automatic SSL encryption.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
