import React from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Plus } from '@untitledui/icons';

const Agents = () => {
  const { currentOrg } = useOrganization();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Agents</h1>
            <p className="text-muted-foreground">
              Manage AI agents for {currentOrg?.name || 'your organization'}
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Agent
          </Button>
        </div>

        <div className="text-center py-12 text-muted-foreground">
          <p>Agent management coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default Agents;
