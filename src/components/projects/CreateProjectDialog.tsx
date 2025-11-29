import React from 'react';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientCompanyName?: string;
  onProjectCreated?: () => void;
}

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = () => {
  return null;
};
