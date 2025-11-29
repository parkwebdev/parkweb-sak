import React from 'react';

interface RequestKanbanViewProps {
  openRequestId?: string | null;
}

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const RequestKanbanView: React.FC<RequestKanbanViewProps> = () => {
  return (
    <div className="flex items-center justify-center p-8 text-muted-foreground">
      <p>Request Kanban view is being rebuilt for the new multi-tenant architecture.</p>
    </div>
  );
};
