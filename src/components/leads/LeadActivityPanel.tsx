/**
 * Lead Activity Panel Component
 * 
 * Container for the activity feed and comments in the lead details sheet.
 * Uses tabs to switch between activity and comments views.
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LeadActivityFeed } from './LeadActivityFeed';
import { LeadComments } from './LeadComments';
import { useLeadComments } from '@/hooks/useLeadComments';
import { useLeadActivities } from '@/hooks/useLeadActivities';
import { ClockRefresh, MessageTextSquare02 } from '@untitledui/icons';

interface LeadActivityPanelProps {
  leadId: string;
}

export function LeadActivityPanel({ leadId }: LeadActivityPanelProps) {
  const { comments } = useLeadComments(leadId);
  const { activities } = useLeadActivities(leadId);

  return (
    <Tabs defaultValue="activity" className="flex flex-col h-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="activity" className="gap-1.5">
          <ClockRefresh className="h-4 w-4" />
          Activity
          {activities.length > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({activities.length})
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="comments" className="gap-1.5">
          <MessageTextSquare02 className="h-4 w-4" />
          Comments
          {comments.length > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="activity" className="flex-1 mt-0 min-h-0">
        <ScrollArea className="h-full pr-3">
          <LeadActivityFeed leadId={leadId} />
        </ScrollArea>
      </TabsContent>

      <TabsContent value="comments" className="flex-1 mt-0 min-h-0 flex flex-col">
        <LeadComments leadId={leadId} />
      </TabsContent>
    </Tabs>
  );
}
