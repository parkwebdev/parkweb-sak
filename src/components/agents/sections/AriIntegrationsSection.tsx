/**
 * AriIntegrationsSection Component
 * 
 * Integrations management for social, email, and calendar connections.
 * Displays available integrations with connection status and actions.
 * 
 * @module components/agents/sections/AriIntegrationsSection
 */

import { useState, ReactNode, useCallback } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Link03, CheckCircle, Mail01, LinkBroken01, Loading02 } from '@untitledui/icons';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { FeatureGate } from '@/components/subscription';
import { EmptyState } from '@/components/ui/empty-state';
import { AriSectionHeader } from './AriSectionHeader';
import { Facebook, Instagram, Google } from '@ridemountainpig/svgl-react';
import { GoogleCalendarLogo, MicrosoftOutlookLogo, MicrosoftLogo } from '@/components/icons/CalendarLogos';
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog';
import { SkeletonIntegrationsSection } from '@/components/ui/skeleton';
import { useConnectedAccounts, ConnectedAccount } from '@/hooks/useConnectedAccounts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import { getErrorMessage } from '@/types/errors';

type IntegrationsTab = 'social' | 'email' | 'calendars';

interface Integration {
  id: string;
  name: string;
  description: string;
  logo?: string;
  logoDark?: string;
  logoComponent?: ReactNode;
  connected: boolean;
  comingSoon?: boolean;
}

interface AriIntegrationsSectionProps {
  agentId: string;
}

// Custom SVG Components
const XLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 1200 1227" fill="none">
    <path 
      fill="currentColor" 
      d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026ZM569.165 687.828l-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z"
    />
  </svg>
);

const socialIntegrations: Integration[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Connect Facebook Messenger to receive and respond to messages',
    logoComponent: <Facebook className="h-8 w-8" />,
    connected: false,
    comingSoon: true,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Connect Instagram DMs to handle customer inquiries',
    logoComponent: <Instagram className="h-8 w-8" />,
    connected: false,
    comingSoon: true,
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    description: 'Connect X to respond to direct messages',
    logoComponent: <XLogo className="h-7 w-7" />,
    connected: false,
    comingSoon: true,
  },
];

const emailIntegrations: Integration[] = [
  {
    id: 'google-email',
    name: 'Google',
    description: 'Connect Gmail to handle email conversations',
    logoComponent: <Google className="h-8 w-8" />,
    connected: false,
    comingSoon: true,
  },
  {
    id: 'microsoft-email',
    name: 'Microsoft',
    description: 'Connect Outlook to manage email communications',
    logoComponent: <MicrosoftOutlookLogo className="h-8 w-8" />,
    connected: false,
    comingSoon: true,
  },
  {
    id: 'smtp',
    name: 'SMTP',
    description: 'Configure custom SMTP server for email delivery',
    logoComponent: <Mail01 className="h-7 w-7 text-muted-foreground" />,
    connected: false,
    comingSoon: true,
  },
];

export function AriIntegrationsSection({ agentId }: AriIntegrationsSectionProps) {
  const [activeTab, setActiveTab] = useState<IntegrationsTab>('social');
  const prefersReducedMotion = useReducedMotion();
  
  // Get agent-level connected calendars (no locationId = agent default)
  const { accounts: connectedCalendars, loading: calendarsLoading, disconnectAccount, refetch } = useConnectedAccounts(undefined, agentId);
  const [connecting, setConnecting] = useState<'google' | 'outlook' | null>(null);
  const [disconnectId, setDisconnectId] = useState<string | null>(null);

  const accountToDisconnect = connectedCalendars.find((a) => a.id === disconnectId);

  const getIntegrations = () => {
    switch (activeTab) {
      case 'social':
        return socialIntegrations;
      case 'email':
        return emailIntegrations;
      case 'calendars':
        // Return empty array - we render calendar integrations differently
        return [];
      default:
        return [];
    }
  };

  const handleConnect = (integrationId: string) => {
    logger.info('Connect integration:', integrationId);
  };

  // OAuth flow for calendar connections
  const initiateOAuth = useCallback(async (provider: 'google' | 'outlook') => {
    setConnecting(provider);
    try {
      const functionName = provider === 'google' ? 'google-calendar-auth' : 'outlook-calendar-auth';
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          action: 'initiate',
          locationId: null, // null = agent-level default calendar
          agentId,
        },
      });

      if (error) throw error;
      if (!data?.authUrl) throw new Error('No auth URL returned');

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        data.authUrl,
        'CalendarOAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth callback message
      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === 'oauth-callback') {
          popup?.close();
          window.removeEventListener('message', handleMessage);
          setConnecting(null);
          
          if (event.data.success) {
            toast.success(`${event.data.provider || (provider === 'google' ? 'Google Calendar' : 'Outlook Calendar')} connected as default`);
            refetch();
          } else {
            toast.error('Failed to connect calendar', { description: event.data.error });
          }
        }
      };

      window.addEventListener('message', handleMessage);

      // Cleanup if popup is closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setConnecting(null);
        }
      }, 500);
    } catch (error: unknown) {
      logger.error('OAuth initiation error:', error);
      toast.error('Failed to start calendar connection', { description: getErrorMessage(error) });
      setConnecting(null);
    }
  }, [agentId, refetch]);

  const handleDisconnect = async () => {
    if (!disconnectId) return;
    await disconnectAccount(disconnectId);
    setDisconnectId(null);
  };

  // Find connected accounts by provider
  const googleCalendarAccount = connectedCalendars.find(a => a.provider === 'google_calendar');
  const outlookCalendarAccount = connectedCalendars.find(a => a.provider === 'outlook_calendar');

  const IntegrationCard = ({ integration }: { integration: Integration }) => (
    <div className="px-4 py-3 rounded-card border bg-card hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-md bg-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {integration.logoComponent ? (
            <div className="h-5 w-5 [&>svg]:h-5 [&>svg]:w-5">{integration.logoComponent}</div>
          ) : integration.logoDark ? (
            <>
              <img 
                src={integration.logo} 
                alt={`${integration.name} logo`}
                className="h-5 w-5 object-contain dark:hidden"
                loading="lazy"
                decoding="async"
              />
              <img 
                src={integration.logoDark} 
                alt={`${integration.name} logo`}
                className="h-5 w-5 object-contain hidden dark:block"
                loading="lazy"
                decoding="async"
              />
            </>
          ) : (
            <img 
              src={integration.logo} 
              alt={`${integration.name} logo`}
              className="h-5 w-5 object-contain"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium">{integration.name}</h3>
            {integration.connected && (
              <Badge variant="default" size="sm" className="px-1.5 py-0 bg-status-active/10 text-status-active border-status-active/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{integration.description}</p>
        </div>
        
        <div className="flex-shrink-0">
          {integration.comingSoon ? (
            <Button variant="secondary" size="sm" disabled>
              Coming Soon
            </Button>
          ) : integration.connected ? (
            <div className="flex items-center gap-2">
              <Switch checked={true} />
              <Button variant="ghost" size="sm" className="text-destructive">
                Disconnect
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleConnect(integration.id)}
            >
              <Link03 className="h-3.5 w-3.5 mr-1.5" />
              Connect
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  // Calendar integration card with real connection status
  const CalendarIntegrationCard = ({ 
    provider, 
    account 
  }: { 
    provider: 'google' | 'outlook';
    account: ConnectedAccount | undefined;
  }) => {
    const isGoogle = provider === 'google';
    const name = isGoogle ? 'Google Calendar' : 'Outlook Calendar';
    const description = isGoogle 
      ? 'Default calendar for locations without their own' 
      : 'Default calendar for appointments';
    const Logo = isGoogle ? GoogleCalendarLogo : MicrosoftLogo;
    const isConnecting = connecting === provider;
    
    return (
      <div className="px-4 py-3 rounded-card border bg-card hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <Logo className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium">{name}</h3>
              {account && (
                <Badge variant="default" size="sm" className="px-1.5 py-0 bg-status-active/10 text-status-active border-status-active/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Default
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {account ? account.account_email : description}
            </p>
          </div>
          
          <div className="flex-shrink-0">
            {account ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive hover:text-destructive"
                onClick={() => setDisconnectId(account.id)}
              >
                <LinkBroken01 className="h-3.5 w-3.5 mr-1.5" />
                Disconnect
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => initiateOAuth(provider)}
                disabled={!!connecting}
              >
                <Link03 className="h-3.5 w-3.5 mr-1.5" />
                {isConnecting ? 'Connecting...' : 'Connect'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Show loading skeleton while initial data is loading
  if (calendarsLoading && activeTab === 'calendars') {
    return (
      <div>
        <AriSectionHeader
          title="Integrations"
          description="Connect social media, email, and calendar services"
        />
        <SkeletonIntegrationsSection />
      </div>
    );
  }

  return (
    <FeatureGate feature="integrations" loadingSkeleton={<SkeletonIntegrationsSection />}>
      <div>
        <AriSectionHeader
          title="Integrations"
          description="Connect social media, email, and calendar services"
        />

      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as IntegrationsTab)}>
          <TabsList>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="calendars">Calendars</TabsTrigger>
          </TabsList>
        </Tabs>

        <motion.div 
          className="space-y-3"
          initial="hidden"
          animate="visible"
          key={activeTab}
          variants={prefersReducedMotion ? {} : {
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.08, delayChildren: 0.05 }
            }
          }}
        >
          {/* Standard integrations for social/email */}
          {activeTab !== 'calendars' && getIntegrations().map((integration) => (
            <motion.div 
              key={integration.id}
              variants={prefersReducedMotion ? {} : {
                hidden: { opacity: 0, y: 12 },
                visible: { 
                  opacity: 1, 
                  y: 0,
                  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
                }
              }}
            >
              <IntegrationCard integration={integration} />
            </motion.div>
          ))}

          {/* Calendar integrations with real connection status */}
          {activeTab === 'calendars' && (
            <>
              <motion.div 
                variants={prefersReducedMotion ? {} : {
                  hidden: { opacity: 0, y: 12 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
                  }
                }}
              >
                <CalendarIntegrationCard provider="google" account={googleCalendarAccount} />
              </motion.div>
              <motion.div 
                variants={prefersReducedMotion ? {} : {
                  hidden: { opacity: 0, y: 12 },
                  visible: { 
                    opacity: 1, 
                    y: 0,
                    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
                  }
                }}
              >
                <CalendarIntegrationCard provider="outlook" account={outlookCalendarAccount} />
              </motion.div>
              
              <Separator className="my-4" />
              
              <p className="text-xs text-muted-foreground">
                Connect a default calendar here. Locations without their own calendar will use this one for scheduling.
                You can also connect specific calendars for each location in their settings.
              </p>
            </>
          )}
        </motion.div>

        {activeTab !== 'calendars' && getIntegrations().length === 0 && (
          <EmptyState
            icon={<Link03 className="h-5 w-5 text-muted-foreground/50" />}
            title="No integrations available for this category yet."
          />
        )}
      </div>

      <DeleteConfirmationDialog
        open={!!disconnectId}
        onOpenChange={(open: boolean) => !open && setDisconnectId(null)}
        title="Disconnect Default Calendar"
        description={`Are you sure you want to disconnect "${accountToDisconnect?.account_email}"? Locations without their own calendar will no longer have scheduling available.`}
        onConfirm={handleDisconnect}
        actionLabel="Disconnect"
      />
      </div>
    </FeatureGate>
  );
}
