/**
 * @fileoverview Upgrade prompt shown when a feature is not included in the user's plan.
 * Displays feature-specific messaging with an upgrade CTA.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Lock01, 
  Code01, 
  Link03, 
  MessageChatCircle, 
  Tool02, 
  Dataflow03, 
  Database01, 
  MarkerPin01, 
  Calendar,
  TrendUp01,
  BarChart01,
  ClockRefresh,
} from '@untitledui/icons';
import { useNavigate } from 'react-router-dom';
import { useCanManage } from '@/hooks/useCanManage';

type FeatureType = 
  | 'widget' | 'api' | 'webhooks'
  | 'custom_tools' | 'integrations'
  | 'knowledge_sources' | 'locations' | 'calendar_booking'
  | 'advanced_analytics' | 'report_builder' | 'scheduled_reports';

interface FeatureInfo {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FEATURE_INFO: Record<FeatureType, FeatureInfo> = {
  // Core
  widget: {
    icon: <MessageChatCircle size={24} aria-hidden="true" />,
    title: 'Chat Widget',
    description: 'Embed a chat widget on your website to engage visitors 24/7 with AI-powered conversations.',
  },
  api: {
    icon: <Code01 size={24} aria-hidden="true" />,
    title: 'API Access',
    description: 'Integrate Ari programmatically into your systems with full API access and custom workflows.',
  },
  webhooks: {
    icon: <Link03 size={24} aria-hidden="true" />,
    title: 'Webhooks',
    description: 'Send real-time events to external APIs when actions occur in your conversations.',
  },
  // Tools
  custom_tools: {
    icon: <Tool02 size={24} aria-hidden="true" />,
    title: 'Custom Tools',
    description: 'Create custom API integrations and external tool connections to extend Ari\'s capabilities.',
  },
  integrations: {
    icon: <Dataflow03 size={24} aria-hidden="true" />,
    title: 'Integrations',
    description: 'Connect social media, email, and calendar services for multi-channel engagement.',
  },
  // Knowledge & Locations
  knowledge_sources: {
    icon: <Database01 size={24} aria-hidden="true" />,
    title: 'Knowledge Sources',
    description: 'Train Ari with documents, URLs, and custom content to provide accurate, contextual responses.',
  },
  locations: {
    icon: <MarkerPin01 size={24} aria-hidden="true" />,
    title: 'Locations',
    description: 'Manage multiple locations with location-specific knowledge and calendar integrations.',
  },
  calendar_booking: {
    icon: <Calendar size={24} aria-hidden="true" />,
    title: 'Calendar Booking',
    description: 'Enable AI-powered appointment scheduling with integrated calendar connections.',
  },
  // Analytics & Reporting
  advanced_analytics: {
    icon: <TrendUp01 size={24} aria-hidden="true" />,
    title: 'Advanced Analytics',
    description: 'Deep insights into AI performance, visitor behavior, and conversion metrics.',
  },
  report_builder: {
    icon: <BarChart01 size={24} aria-hidden="true" />,
    title: 'Report Builder',
    description: 'Build and export custom analytics reports with flexible configuration options.',
  },
  scheduled_reports: {
    icon: <ClockRefresh size={24} aria-hidden="true" />,
    title: 'Scheduled Reports',
    description: 'Automated report delivery via email on daily, weekly, or monthly schedules.',
  },
};

interface UpgradePromptProps {
  feature: FeatureType;
  className?: string;
}

export function UpgradePrompt({ feature, className }: UpgradePromptProps) {
  const navigate = useNavigate();
  const canViewBilling = useCanManage('view_billing');
  const info = FEATURE_INFO[feature];

  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
          <Lock01 size={20} className="text-muted-foreground" aria-hidden="true" />
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <span className="text-primary">{info.icon}</span>
          <h3 className="text-lg font-semibold">{info.title}</h3>
        </div>
        
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {info.description}
        </p>
        
        <p className="text-sm text-muted-foreground mb-4">
          This feature is not included in your current plan.
        </p>

        {canViewBilling && (
          <Button onClick={() => navigate('/settings?tab=billing')}>
            Upgrade Plan
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
