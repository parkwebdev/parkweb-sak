import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ClientsHeader } from '@/components/clients/ClientsHeader';
import { ClientsList } from '@/components/clients/ClientsList';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { ClientFolderNavigation } from '@/components/clients/ClientFolderNavigation';
import { useClients } from '@/hooks/useClients';

interface ClientsProps {
  onMenuClick?: () => void;
}

export const Clients: React.FC<ClientsProps> = ({ onMenuClick }) => {
  const [viewMode, setViewMode] = useState<"table" | "cards" | "folders">("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const { clients } = useClients();

  return (
    <>
      <ClientsHeader
        onSearch={setSearchQuery}
        onCreateClient={() => {}}
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
                    />
                  </CardContent>
                </Card>
              ) : (
                <ClientsList />
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Clients;