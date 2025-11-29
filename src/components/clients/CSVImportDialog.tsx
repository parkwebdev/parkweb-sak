import React from 'react';

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const CSVImportDialog: React.FC<CSVImportDialogProps> = () => {
  return null;
};
