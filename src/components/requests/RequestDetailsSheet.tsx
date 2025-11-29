import React from 'react';

interface RequestDetailsSheetProps {
  request: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const RequestDetailsSheet: React.FC<RequestDetailsSheetProps> = () => {
  return null;
};
