import { useState, ReactNode } from 'react';
import { motion } from 'motion/react';
import { logger } from '@/utils/logger';
import { AgentSettingsLayout } from '@/components/agents/AgentSettingsLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link03, CheckCircle, Mail01 } from '@untitledui/icons';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EmptyState } from '@/components/ui/empty-state';
import { Facebook, Instagram, Google, Gmail } from '@ridemountainpig/svgl-react';

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

interface AgentIntegrationsTabProps {
  agentId: string;
}

// Custom SVG Components
const MicrosoftOutlookLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="60 90.4 570.02 539.67">
    <defs>
      <linearGradient id="outlook_a" x1="9.989" x2="30.932" y1="22.365" y2="9.375" gradientTransform="scale(15)" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#20a7fa" />
        <stop offset=".4" stopColor="#3bd5ff" />
        <stop offset="1" stopColor="#c4b0ff" />
      </linearGradient>
      <linearGradient id="outlook_b" x1="17.197" x2="28.856" y1="26.794" y2="8.126" gradientTransform="scale(15)" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#165ad9" />
        <stop offset=".501" stopColor="#1880e5" />
        <stop offset="1" stopColor="#8587ff" />
      </linearGradient>
      <linearGradient id="outlook_d" x1="24.053" x2="44.51" y1="31.11" y2="18.018" gradientTransform="scale(15)" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#1a43a6" />
        <stop offset=".492" stopColor="#2052cb" />
        <stop offset="1" stopColor="#5f20cb" />
      </linearGradient>
      <linearGradient id="outlook_g" x1="41.998" x2="23.852" y1="29.943" y2="29.943" gradientTransform="scale(15)" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#4dc4ff" />
        <stop offset=".196" stopColor="#0fafff" />
      </linearGradient>
      <radialGradient id="outlook_j" cx="0" cy="0" r="1" gradientTransform="matrix(-170.86087 259.7254 -674.01813 -443.40415 278.562 412.979)" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#49deff" />
        <stop offset=".724" stopColor="#29c3ff" />
      </radialGradient>
      <radialGradient id="outlook_l" cx="0" cy="0" r="1" gradientTransform="rotate(46.924 -378.504 245.25) scale(315.927)" gradientUnits="userSpaceOnUse">
        <stop offset=".039" stopColor="#0091ff" />
        <stop offset=".919" stopColor="#183dad" />
      </radialGradient>
    </defs>
    <path d="m463.984 140.145-344.347 218.27-29.614-46.72v-40.257a43.26 43.26 0 0 1 19.72-36.293L309.91 105.258c30.496-19.79 69.777-19.793 100.277-.008Zm0 0" fill="url(#outlook_a)" />
    <path d="M407.102 103.34a91.293 91.293 0 0 1 3.082 1.914l156.214 101.332-387.336 245.52-59.437-93.77L403.895 177.8c26.925-17.102 28.105-55.57 3.207-74.461Zm0 0" fill="url(#outlook_b)" />
    <path d="M333.602 498.988 179.066 452.11 507.63 243.836c27.672-17.54 27.601-57.938-.133-75.379l-1.48-.93 4.261 2.649 99.996 64.867a43.263 43.263 0 0 1 19.723 36.3v38.962Zm0 0" fill="url(#outlook_d)" />
    <path d="M315.77 630.05h220.449c51.777 0 93.75-41.972 93.75-93.75V272.14c0 15.301-7.864 29.528-20.82 37.665l-327.907 205.89a60.712 60.712 0 0 0-28.422 51.414c.004 34.762 28.184 62.942 62.95 62.942Zm0 0" fill="url(#outlook_g)" />
    <path d="M405.402 630.035H183.738c-51.777 0-93.75-41.972-93.75-93.75v-264.34a44.473 44.473 0 0 0 20.754 37.621l327.582 206.52a61.737 61.737 0 0 1 28.809 52.226c-.004 34.09-27.64 61.723-61.73 61.723Zm0 0" fill="url(#outlook_j)" />
    <path d="M108.75 345h142.5c26.926 0 48.75 21.824 48.75 48.75v142.5c0 26.926-21.824 48.75-48.75 48.75h-142.5C81.824 585 60 563.176 60 536.25v-142.5C60 366.824 81.824 345 108.75 345Zm0 0" fill="url(#outlook_l)" />
    <path d="M179.387 534c-19.848 0-36.137-6.21-48.875-18.625-12.739-12.414-19.11-28.617-19.11-48.605 0-21.11 6.465-38.18 19.395-51.22C143.73 402.517 160.66 396 181.594 396c19.781 0 35.879 6.238 48.297 18.715 12.484 12.476 18.726 28.93 18.726 49.351 0 20.985-6.469 37.899-19.398 50.75C216.352 527.606 199.742 534 179.387 534Zm.574-26.352c10.816 0 19.523-3.695 26.117-11.082 6.594-7.386 9.89-17.664 9.89-30.824 0-13.719-3.202-24.394-9.6-32.031-6.403-7.637-14.95-11.453-25.638-11.453-11.011 0-19.878 3.941-26.597 11.824-6.723 7.824-10.082 18.191-10.082 31.102 0 13.101 3.36 23.468 10.082 31.101 6.719 7.574 15.328 11.363 25.828 11.363Zm0 0" fill="#fff" />
  </svg>
);

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

const GoogleCalendarLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 200 200">
    <g transform="translate(3.75 3.75)">
      <path fill="#FFFFFF" d="M148.882,43.618l-47.368-5.263l-57.895,5.263L38.355,96.25l5.263,52.632l52.632,6.579l52.632-6.579l5.263-53.947L148.882,43.618z"/>
      <path fill="#1A73E8" d="M65.211,125.276c-3.934-2.658-6.658-6.539-8.145-11.671l9.132-3.763c0.829,3.158,2.276,5.605,4.342,7.342c2.053,1.737,4.553,2.592,7.474,2.592c2.987,0,5.553-0.908,7.697-2.724s3.224-4.132,3.224-6.934c0-2.868-1.132-5.211-3.395-7.026s-5.105-2.724-8.5-2.724h-5.276v-9.039H76.5c2.921,0,5.382-0.789,7.382-2.368c2-1.579,3-3.737,3-6.487c0-2.447-0.895-4.395-2.684-5.855s-4.053-2.197-6.803-2.197c-2.684,0-4.816,0.711-6.395,2.145s-2.724,3.197-3.447,5.276l-9.039-3.763c1.197-3.395,3.395-6.395,6.618-8.987c3.224-2.592,7.342-3.895,12.342-3.895c3.697,0,7.026,0.711,9.974,2.145c2.947,1.434,5.263,3.421,6.934,5.947c1.671,2.539,2.5,5.382,2.5,8.539c0,3.224-0.776,5.947-2.329,8.184c-1.553,2.237-3.461,3.947-5.724,5.145v0.539c2.987,1.25,5.421,3.158,7.342,5.724c1.908,2.566,2.868,5.632,2.868,9.211s-0.908,6.776-2.724,9.579c-1.816,2.803-4.329,5.013-7.513,6.618c-3.197,1.605-6.789,2.421-10.776,2.421C73.408,129.263,69.145,127.934,65.211,125.276z"/>
      <path fill="#1A73E8" d="M121.25,79.961l-9.974,7.25l-5.013-7.605l17.987-12.974h6.895v61.197h-9.895L121.25,79.961z"/>
      <path fill="#EA4335" d="M148.882,196.25l47.368-47.368l-23.684-10.526l-23.684,10.526l-10.526,23.684L148.882,196.25z"/>
      <path fill="#34A853" d="M33.092,172.566l10.526,23.684h105.263v-47.368H43.618L33.092,172.566z"/>
      <path fill="#4285F4" d="M12.039-3.75C3.316-3.75-3.75,3.316-3.75,12.039v136.842l23.684,10.526l23.684-10.526V43.618h105.263l10.526-23.684L148.882-3.75H12.039z"/>
      <path fill="#188038" d="M-3.75,148.882v31.579c0,8.724,7.066,15.789,15.789,15.789h31.579v-47.368H-3.75z"/>
      <path fill="#FBBC04" d="M148.882,43.618v105.263h47.368V43.618l-23.684-10.526L148.882,43.618z"/>
      <path fill="#1967D2" d="M196.25,43.618V12.039c0-8.724-7.066-15.789-15.789-15.789h-31.579v47.368H196.25z"/>
    </g>
  </svg>
);

const MicrosoftLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 256 256">
    <path fill="#F1511B" d="M121.666 121.666H0V0h121.666z" />
    <path fill="#80CC28" d="M256 121.666H134.335V0H256z" />
    <path fill="#00ADEF" d="M121.663 256.002H0V134.336h121.663z" />
    <path fill="#FBBC09" d="M256 256.002H134.335V134.336H256z" />
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

export const AgentIntegrationsTab = ({ agentId }: AgentIntegrationsTabProps) => {
  const [activeTab, setActiveTab] = useState<IntegrationsTab>('social');
  const prefersReducedMotion = useReducedMotion();

  const menuItems = [
    { 
      id: 'social' as const, 
      label: 'Social',
      description: 'Connect social media platforms to receive and respond to messages across channels'
    },
    { 
      id: 'email' as const, 
      label: 'Email',
      description: 'Integrate email providers to manage customer communications via email'
    },
    { 
      id: 'calendars' as const, 
      label: 'Calendars',
      description: 'Connect calendar services to enable scheduling and appointment booking'
    },
  ];

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
            <h4 className="text-sm font-medium">{integration.name}</h4>
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
    <AgentSettingsLayout
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as IntegrationsTab)}
      menuItems={menuItems}
      title="Integrations"
      description={menuItems.find(item => item.id === activeTab)?.description || ''}
    >
      <ScrollArea className="h-[calc(100vh-280px)]">
        <motion.div 
          className="space-y-3 pr-4"
          initial="hidden"
          animate="visible"
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
      </ScrollArea>
    </AgentSettingsLayout>
  );
};
