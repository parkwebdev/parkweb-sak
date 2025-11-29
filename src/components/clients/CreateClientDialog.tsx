import React from 'react';

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated?: () => void;
}

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const CreateClientDialog: React.FC<CreateClientDialogProps> = () => {
  return null;
};
