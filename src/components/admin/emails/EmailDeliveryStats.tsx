/**
 * EmailDeliveryStats Component
 * 
 * Cards showing email delivery statistics.
 * 
 * @module components/admin/emails/EmailDeliveryStats
 */

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Check, AlertCircle, Mail01, Send01 } from '@untitledui/icons';
import { formatCompactNumber } from '@/lib/admin/admin-utils';
import type { EmailDeliveryStats as EmailStats } from '@/types/admin';

interface EmailDeliveryStatsProps {
  /** Delivery statistics */
  stats: EmailStats;
  /** Loading state */
  loading: boolean;
}

interface StatItem {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}

/**
 * Email delivery stats cards.
 */
export function EmailDeliveryStats({ stats, loading }: EmailDeliveryStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems: StatItem[] = [
    { label: 'Sent', value: stats.sent, icon: Send01, color: 'text-foreground' },
    { label: 'Delivered', value: stats.delivered, icon: Check, color: 'text-status-active' },
    { label: 'Opened', value: stats.opened, icon: Eye, color: 'text-primary' },
    { label: 'Clicked', value: stats.clicked, icon: Mail01, color: 'text-primary' },
    { label: 'Bounced', value: stats.bounced, icon: AlertCircle, color: 'text-destructive' },
    { label: 'Failed', value: stats.failed, icon: AlertCircle, color: 'text-destructive' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statItems.map(({ label, value, icon: Icon, color }) => (
        <Card key={label}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <Icon size={16} className={color} aria-hidden="true" />
              <span className="text-2xl font-bold">{formatCompactNumber(value)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
