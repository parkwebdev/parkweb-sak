import React from 'react';

interface ClientFolderNavigationProps {
  currentFolder?: string | null;
  onFolderChange: (folderId: string | null) => void;
  clientCount: number;
  clientsByFolder: Record<string, number>;
}

// Temporarily disabled - will be rebuilt for multi-tenant architecture
export const ClientFolderNavigation: React.FC<ClientFolderNavigationProps> = () => {
  return (
    <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
      <p>Folder navigation is being rebuilt for the new multi-tenant architecture.</p>
    </div>
  );
};
