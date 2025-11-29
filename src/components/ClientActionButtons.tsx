import React from 'react';

interface ClientActionButtonsProps {
  activeTab: string;
  onRefresh?: () => void;
}

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const ClientActionButtons: React.FC<ClientActionButtonsProps> = () => {
  return null;
};

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const RowActionButtons: React.FC<{
  item: any;
  activeTab: string;
  onRefresh?: () => void;
}> = () => {
  return null;
};
