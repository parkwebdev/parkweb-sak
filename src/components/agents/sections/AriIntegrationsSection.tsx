/**
 * AriIntegrationsSection Component
 * 
 * Integrations management for social, email, and calendar connections.
 * Displays available integrations with connection status and actions.
 * 
 * @module components/agents/sections/AriIntegrationsSection
 */

import { useState, ReactNode } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link03, CheckCircle, Mail01 } from '@untitledui/icons';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EmptyState } from '@/components/ui/empty-state';
import { AriSectionHeader } from './AriSectionHeader';
import { Facebook, Instagram, Google } from '@ridemountainpig/svgl-react';
import { GoogleCalendarLogo, MicrosoftOutlookLogo, MicrosoftLogo } from '@/components/icons/CalendarLogos';
import { logger } from '@/utils/logger';

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

const calendarIntegrations: Integration[] = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync with Google Calendar for scheduling',
    logoComponent: <GoogleCalendarLogo className="h-8 w-8" />,
    connected: false,
    comingSoon: true,
  },
  {
    id: 'microsoft-calendar',
    name: 'Outlook',
    description: 'Connect Outlook Calendar for appointments',
    logoComponent: <MicrosoftLogo className="h-7 w-7" />,
    connected: false,
    comingSoon: true,
  },
];

export function AriIntegrationsSection({ agentId }: AriIntegrationsSectionProps) {
  const [activeTab, setActiveTab] = useState<IntegrationsTab>('social');
  const prefersReducedMotion = useReducedMotion();

  const getIntegrations = () => {
    switch (activeTab) {
      case 'social':
        return socialIntegrations;
      case 'email':
        return emailIntegrations;
      case 'calendars':
        return calendarIntegrations;
      default:
        return [];
    }
  };

  const handleConnect = (integrationId: string) => {
    logger.info('Connect integration:', integrationId);
  };

  const IntegrationCard = ({ integration }: { integration: Integration }) => (
    <div className="p-5 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {integration.logoComponent ? (
            integration.logoComponent
          ) : integration.logoDark ? (
            <>
              <img 
                src={integration.logo} 
                alt={`${integration.name} logo`}
                className="h-8 w-8 object-contain dark:hidden"
              />
              <img 
                src={integration.logoDark} 
                alt={`${integration.name} logo`}
                className="h-8 w-8 object-contain hidden dark:block"
              />
            </>
          ) : (
            <img 
              src={integration.logo} 
              alt={`${integration.name} logo`}
              className="h-8 w-8 object-contain"
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

  return (
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
          {getIntegrations().map((integration) => (
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
        </motion.div>

        {getIntegrations().length === 0 && (
          <EmptyState
            icon={<Link03 className="h-5 w-5 text-muted-foreground/50" />}
            title="No integrations available for this category yet."
          />
        )}
      </div>
    </div>
  );
}
