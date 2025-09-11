import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ClientsHeader } from '@/components/clients/ClientsHeader';
import { ClientsList } from '@/components/clients/ClientsList';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { ClientFolderNavigation } from '@/components/clients/ClientFolderNavigation';
import { CreateClientDialog } from '@/components/clients/CreateClientDialog';
import { useClients } from '@/hooks/useClients';

interface ClientsProps {
  onMenuClick?: () => void;
}

export const Clients: React.FC<ClientsProps> = ({ onMenuClick }) => {
  const [viewMode, setViewMode] = useState<"table" | "cards" | "folders">("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { clients, loading, refetch } = useClients();

  // Calculate client counts by folder
  const clientsByFolder = clients.reduce((acc, client) => {
    if (client.folder_id) {
      acc[client.folder_id] = (acc[client.folder_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Filter clients by current folder
  const filteredClients = currentFolder 
    ? clients.filter(client => client.folder_id === currentFolder)
    : clients;

  return (
    <>
      <ClientsHeader
        onSearch={setSearchQuery}
        onCreateClient={() => setShowCreateDialog(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onMenuClick={onMenuClick}
      />

      <section className="w-full mt-6 pb-12">
        <div className="w-full px-4 lg:px-8 py-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Folder Navigation Sidebar */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
              <ClientFolderNavigation
                currentFolder={currentFolder}
                onFolderChange={setCurrentFolder}
                clientCount={clients.length}
                clientsByFolder={clientsByFolder}
              />
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {viewMode === "table" ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-0">
                    <ClientsTable
                      currentFolder={currentFolder}
                      searchQuery={searchQuery}
                      clients={filteredClients}
                    />
                  </CardContent>
                </Card>
              ) : (
                <ClientsList clients={filteredClients} />
              )}
            </div>
          </div>
        </div>
      </section>

      <CreateClientDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onClientCreated={refetch}
      />
    </>
  );
};

export default Clients;