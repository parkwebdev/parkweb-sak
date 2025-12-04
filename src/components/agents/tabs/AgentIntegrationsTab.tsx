import { useState } from 'react';
import { AgentSettingsLayout } from '@/components/agents/AgentSettingsLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatedList } from '@/components/ui/animated-list';
import { AnimatedItem } from '@/components/ui/animated-item';
import { Link03, CheckCircle } from '@untitledui/icons';

type IntegrationsTab = 'social' | 'email' | 'calendars';

interface Integration {
  id: string;
  name: string;
  description: string;
  logo: string;
  logoDark?: string;
  connected: boolean;
  comingSoon?: boolean;
}

interface AgentIntegrationsTabProps {
  agentId: string;
}

const socialIntegrations: Integration[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Connect Facebook Messenger to receive and respond to messages',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png',
    connected: false,
    comingSoon: true,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Connect Instagram DMs to handle customer inquiries',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png',
    connected: false,
    comingSoon: true,
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    description: 'Connect X to respond to direct messages',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg',
    logoDark: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Twitter_new_X_logo.png',
    connected: false,
    comingSoon: true,
  },
];

const emailIntegrations: Integration[] = [
  {
    id: 'google-email',
    name: 'Google',
    description: 'Connect Gmail to handle email conversations',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg',
    connected: false,
    comingSoon: true,
  },
  {
    id: 'microsoft-email',
    name: 'Microsoft',
    description: 'Connect Outlook to manage email communications',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg',
    connected: false,
    comingSoon: true,
  },
  {
    id: 'smtp',
    name: 'SMTP',
    description: 'Configure custom SMTP server for email delivery',
    logo: 'https://svgl.app/library/mailgun.svg',
    connected: false,
    comingSoon: true,
  },
];

const calendarIntegrations: Integration[] = [
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync with Google Calendar for scheduling',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg',
    connected: false,
    comingSoon: true,
  },
  {
    id: 'microsoft-calendar',
    name: 'Microsoft Calendar',
    description: 'Connect Outlook Calendar for appointments',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg',
    connected: false,
    comingSoon: true,
  },
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Enable scheduling through Calendly integration',
    logo: 'https://images.ctfassets.net/k0lk9kiuza3o/1IUGJ03kPYthZP0B0jPjOE/bbd43fb1b1c60e56ffc0ea49db7f4334/calendly-mark-icon.svg',
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
    // TODO: Implement connection flow
    console.log('Connect integration:', integrationId);
  };

  const IntegrationCard = ({ integration }: { integration: Integration }) => (
    <div className="p-5 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {integration.logoDark ? (
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
        <AnimatedList className="space-y-3 pr-4">
          {getIntegrations().map((integration) => (
            <AnimatedItem key={integration.id}>
              <IntegrationCard integration={integration} />
            </AnimatedItem>
          ))}
        </AnimatedList>

        {getIntegrations().length === 0 && (
          <div className="text-center py-12 rounded-lg border border-dashed bg-muted/30">
            <Link03 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No integrations available for this category yet.
            </p>
          </div>
        )}
      </ScrollArea>
    </AgentSettingsLayout>
  );
};
