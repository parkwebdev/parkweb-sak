/**
 * AccountUsageCard Component
 * 
 * Card displaying account usage metrics.
 * 
 * @module components/admin/accounts/AccountUsageCard
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageChatSquare, Target01, BookOpen01, MarkerPin01 } from '@untitledui/icons';

interface AccountUsageCardProps {
  usage: {
    conversationCount: number;
    leadCount: number;
    knowledgeSourceCount: number;
    locationCount: number;
  };
}

/**
 * Card component for displaying account usage metrics.
 */
export function AccountUsageCard({ usage }: AccountUsageCardProps) {
  const stats = [
    { label: 'Conversations', value: usage.conversationCount, icon: MessageChatSquare },
    { label: 'Leads', value: usage.leadCount, icon: Target01 },
    { label: 'Knowledge Sources', value: usage.knowledgeSourceCount, icon: BookOpen01 },
    { label: 'Locations', value: usage.locationCount, icon: MarkerPin01 },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <stat.icon size={16} className="text-muted-foreground" aria-hidden="true" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
