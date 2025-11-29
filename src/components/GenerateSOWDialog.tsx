import React from 'react';

interface GenerateSOWDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated?: (sowData: any) => void;
}

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const GenerateSOWDialog: React.FC<GenerateSOWDialogProps> = () => {
  return null;
};
