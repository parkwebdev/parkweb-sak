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
const CalendlyLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 841.89 595.28">
    <path fill="#006BFF" d="M505.27,365.28c-14.79,12.86-33.19,28.86-66.71,28.86h-20.01c-24.22,0-46.25-8.62-62.01-24.28c-15.39-15.3-23.89-36.22-23.89-58.94v-26.87c0-22.72,8.48-43.66,23.89-58.94c15.77-15.66,37.79-24.28,62.01-24.28h20.01c33.51,0,51.92,16,66.71,28.86c15.34,13.34,28.59,24.86,63.89,24.86c5.48,0,10.86-0.43,16.09-1.26c-0.04-0.11-0.08-0.2-0.12-0.3c-2.1-5.1-4.57-10.12-7.42-14.96l-23.6-40.1c-21.65-36.8-61.68-59.46-104.98-59.46h-47.21c-43.3,0-83.33,22.67-104.98,59.46l-23.6,40.1c-21.65,36.8-21.65,82.12,0,118.91l23.6,40.1c21.65,36.8,61.68,59.45,104.98,59.45h47.21c43.3,0,83.33-22.67,104.98-59.45l23.6-40.1c2.85-4.85,5.32-9.85,7.42-14.95c0.04-0.11,0.08-0.2,0.12-0.3c-5.23-0.83-10.59-1.26-16.09-1.26C533.87,340.42,520.61,351.94,505.27,365.28z" />
    <path fill="#006BFF" d="M438.57,225.16h-20.01c-36.86,0-61.09,25.83-61.09,58.89v26.87c0,33.06,24.22,58.89,61.09,58.89h20.01c53.71,0,49.49-53.72,130.59-53.72c7.77,0,15.45,0.7,22.92,2.06c2.46-13.66,2.46-27.64,0-41.31c-7.48,1.36-15.15,2.06-22.92,2.06C488.06,278.89,492.28,225.16,438.57,225.16z" />
    <path fill="#006BFF" d="M638.66,337.76c-13.85-10.02-29.74-16.56-46.59-19.64c-0.03,0.13-0.04,0.26-0.07,0.39c-1.44,7.87-3.69,15.62-6.77,23.14c14.22,2.26,27.32,7.5,38.52,15.55c-0.04,0.12-0.07,0.24-0.11,0.37c-6.46,20.57-16.2,39.96-28.93,57.6c-12.58,17.42-27.79,32.76-45.22,45.57c-36.18,26.62-79.27,40.68-124.63,40.68c-28.08,0-55.31-5.39-80.94-16.02c-24.75-10.27-46.99-24.98-66.11-43.73c-19.11-18.75-34.1-40.56-44.57-64.85c-10.83-25.14-16.33-51.85-16.33-79.4c0-27.55,5.5-54.26,16.33-79.4c10.47-24.28,25.46-46.1,44.57-64.85c19.11-18.75,41.35-33.45,66.11-43.73c25.62-10.63,52.85-16.02,80.94-16.02c45.36,0,88.45,14.06,124.63,40.68c17.43,12.82,32.63,28.15,45.22,45.57c12.73,17.65,22.47,37.04,28.93,57.6c0.04,0.13,0.08,0.25,0.11,0.37c-11.19,8.04-24.3,13.3-38.52,15.55c3.08,7.53,5.34,15.3,6.77,23.17c0.03,0.13,0.04,0.25,0.07,0.38c16.85-3.08,32.73-9.62,46.59-19.64c13.28-9.64,10.71-20.53,8.69-26.99C618.08,136.9,529.55,69.12,424.87,69.12c-128.55,0-232.75,102.22-232.75,228.32c0,126.1,104.21,228.32,232.75,228.32c104.68,0,193.21-67.79,222.48-161.05C649.38,358.29,651.96,347.41,638.66,337.76z" />
    <path fill="#006BFF" d="M585.25,253.26c-5.23,0.83-10.59,1.26-16.09,1.26c-35.29,0-48.55-11.52-63.89-24.86c-14.79-12.86-33.19-28.86-66.71-28.86h-20.01c-24.22,0-46.25,8.62-62.01,24.28c-15.39,15.3-23.89,36.22-23.89,58.94v26.87c0,22.72,8.48,43.66,23.89,58.94c15.77,15.66,37.79,24.28,62.01,24.28h20.01c33.51,0,51.92-16.01,66.71-28.86c15.34-13.34,28.59-24.86,63.89-24.86c5.48,0,10.86,0.43,16.09,1.26c3.08-7.52,5.32-15.28,6.77-23.14c0.03-0.13,0.04-0.26,0.07-0.39c-7.48-1.36-15.15-2.06-22.92-2.06c-81.1,0-76.88,53.72-130.59,53.72h-20.01c-36.86,0-61.09-25.83-61.09-58.89v-26.87c0-33.06,24.22-58.89,61.09-58.89h20.01c53.71,0,49.5,53.72,130.59,53.72c7.77,0,15.45-0.7,22.92-2.06c-0.03-0.13-0.04-0.25-0.07-0.38C590.59,268.56,588.33,260.8,585.25,253.26z" />
  </svg>
);

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
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Enable scheduling through Calendly integration',
    logoComponent: <CalendlyLogo className="h-8 w-8" />,
    connected: false,
    comingSoon: true,
  },
  {
    id: 'cal-com',
    name: 'Cal.com',
    description: 'Open-source scheduling with Cal.com',
    logo: 'https://cal.com/android-chrome-512x512.png',
    logoDark: 'https://cal.com/logo-white.svg',
    connected: false,
    comingSoon: true,
  },
];

export const AriIntegrationsSection: React.FC<AriIntegrationsSectionProps> = ({ agentId }) => {
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
            {integration.comingSoon && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Coming Soon
              </Badge>
            )}
            {integration.connected && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{integration.description}</p>
        </div>
        
        <div className="flex-shrink-0">
          {integration.comingSoon ? (
            <Button variant="outline" size="sm" disabled className="text-xs">
              Coming Soon
            </Button>
          ) : integration.connected ? (
            <div className="flex items-center gap-2">
              <Switch checked={true} />
              <Button variant="ghost" size="sm" className="text-xs text-destructive">
                Disconnect
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
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
};
