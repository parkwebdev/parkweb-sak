import React from 'react';

interface ClientsTableProps {}

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const ClientsTable: React.FC<ClientsTableProps> = () => {
  return (
    <div className="flex items-center justify-center p-8 text-muted-foreground">
      <p>Clients table is being rebuilt for the new multi-tenant architecture.</p>
    </div>
  );
};
