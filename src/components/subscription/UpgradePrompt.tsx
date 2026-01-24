/**
 * @fileoverview Upgrade prompt shown when a feature is not included in the user's plan.
 * Displays feature-specific messaging with an upgrade CTA that navigates to billing settings.
 */

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lock01 } from '@untitledui/icons';
import { useCanManage } from '@/hooks/useCanManage';

type FeatureType = 
  | 'widget' | 'webhooks'
  | 'custom_tools' | 'integrations'
  | 'knowledge_sources' | 'locations' | 'calendar_booking'
  | 'advanced_analytics' | 'report_builder' | 'scheduled_reports';

interface FeatureInfo {
  title: string;
  description: string;
}

const FEATURE_INFO: Record<FeatureType, FeatureInfo> = {
  // Core
  widget: {
    title: 'Chat Widget',
    description: 'Embed a chat widget on your website to engage visitors 24/7 with AI-powered conversations.',
  },
  webhooks: {
    title: 'Webhooks',
    description: 'Send real-time events to external APIs when actions occur in your conversations.',
  },
  // Tools
  custom_tools: {
    title: 'Custom Tools',
    description: 'Create custom API integrations and external tool connections to extend Ari\'s capabilities.',
  },
  integrations: {
    title: 'Integrations',
    description: 'Connect social media, email, and calendar services for multi-channel engagement.',
  },
  // Knowledge & Locations
  knowledge_sources: {
    title: 'Knowledge Sources',
    description: 'Train Ari with documents, URLs, and custom content to provide accurate, contextual responses.',
  },
  locations: {
    title: 'Locations',
    description: 'Manage multiple locations with location-specific knowledge and calendar integrations.',
  },
  calendar_booking: {
    title: 'Calendar Booking',
    description: 'Enable AI-powered appointment scheduling with integrated calendar connections.',
  },
  // Analytics & Reporting
  advanced_analytics: {
    title: 'Advanced Analytics',
    description: 'Deep insights into AI performance, visitor behavior, and conversion metrics.',
  },
  report_builder: {
    title: 'Report Builder',
    description: 'Build and export custom analytics reports with flexible configuration options.',
  },
  scheduled_reports: {
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

  const handleUpgrade = () => {
    navigate('/settings?tab=billing');
  };

  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
          <Lock01 size={20} className="text-muted-foreground" aria-hidden="true" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2">{info.title}</h3>
        
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {info.description}
        </p>

        {canViewBilling && (
          <Button onClick={handleUpgrade}>
            Upgrade Plan
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
