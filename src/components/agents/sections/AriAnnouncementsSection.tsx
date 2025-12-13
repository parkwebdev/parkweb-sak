/**
 * AriAnnouncementsSection
 * 
 * Announcements management - uses existing announcements hook.
 */

import { useParams } from 'react-router-dom';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { AriSectionHeader } from './AriSectionHeader';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Announcement01 } from '@untitledui/icons';

interface AriAnnouncementsSectionProps {
  agentId: string;
}

export const AriAnnouncementsSection: React.FC<AriAnnouncementsSectionProps> = ({ agentId }) => {
  const { announcements } = useAnnouncements(agentId);

  return (
    <div>
      <AriSectionHeader
        title="Announcements"
        description="Create announcements that appear in the widget home screen"
      />
      <div className="mt-4">
        <EmptyState
          icon={<Announcement01 className="h-5 w-5 text-muted-foreground/50" />}
          title="Announcements coming soon"
          description="This section will be available in a future update"
        />
      </div>
    </div>
  );
};
