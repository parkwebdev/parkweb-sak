import React from 'react';

interface RequestsTableProps {
  openRequestId?: string | null;
}

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const RequestsTable: React.FC<RequestsTableProps> = () => {
  return (
    <div className="flex items-center justify-center p-8 text-muted-foreground">
      <p>Requests table is being rebuilt for the new multi-tenant architecture.</p>
    </div>
  );
};
