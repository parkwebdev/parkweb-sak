import React from 'react';

interface DataTableProps {
  activeTab?: string;
}

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const DataTable: React.FC<DataTableProps> = () => {
  return (
    <div className="flex items-center justify-center p-8 text-muted-foreground">
      <p>Data table component is being rebuilt for the new multi-tenant architecture.</p>
    </div>
  );
};
