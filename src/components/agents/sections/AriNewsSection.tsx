/**
 * AriNewsSection
 * 
 * News items management.
 */

import { useNewsItems } from '@/hooks/useNewsItems';
import { AriSectionHeader } from './AriSectionHeader';
import { EmptyState } from '@/components/ui/empty-state';
import { File06 } from '@untitledui/icons';

interface AriNewsSectionProps {
  agentId: string;
}

export const AriNewsSection: React.FC<AriNewsSectionProps> = ({ agentId }) => {
  const { newsItems } = useNewsItems(agentId);

  return (
    <div>
      <AriSectionHeader
        title="News"
        description="Publish news and updates for your users"
      />
      <div className="mt-4">
        <EmptyState
          icon={<File06 className="h-5 w-5 text-muted-foreground/50" />}
          title="News coming soon"
          description="This section will be available in a future update"
        />
      </div>
    </div>
  );
};
