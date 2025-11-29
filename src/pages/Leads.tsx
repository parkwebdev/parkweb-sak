import React from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';

const Leads = () => {
  const { currentOrg } = useOrganization();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Leads</h1>
          <p className="text-muted-foreground">
            Manage leads captured for {currentOrg?.name || 'your organization'}
          </p>
        </div>

        <div className="text-center py-12 text-muted-foreground">
          <p>Lead management coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default Leads;
