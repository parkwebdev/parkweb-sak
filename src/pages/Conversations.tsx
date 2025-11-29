import React from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Menu01 as Menu } from '@untitledui/icons';

interface ConversationsProps {
  onMenuClick?: () => void;
}

const Conversations: React.FC<ConversationsProps> = ({ onMenuClick }) => {
  const { currentOrg } = useOrganization();

  return (
    <main className="flex-1 bg-muted/30 min-h-screen pt-4 lg:pt-8">
      <header className="w-full font-medium">
        <div className="items-stretch flex w-full flex-col gap-6 px-4 lg:px-8 py-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden flex items-center gap-2"
                onClick={onMenuClick}
              >
                <Menu size={16} />
              </Button>
              <div className="flex-1 sm:flex-none">
                <h1 className="text-xl lg:text-2xl font-semibold text-foreground">Conversations</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  View all conversations for {currentOrg?.name || 'your organization'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 lg:px-8 mt-6">
        <div className="text-center py-12 text-muted-foreground">
          <p>Conversation management coming soon...</p>
        </div>
      </div>
    </main>
  );
};

export default Conversations;
