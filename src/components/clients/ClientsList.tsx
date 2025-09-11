import React, { useState } from 'react';
import { useClients } from '@/hooks/useClients';
import { ClientCard } from './ClientCard';
import { ClientDetailsSheet } from './ClientDetailsSheet';
import { Skeleton } from '@/components/ui/skeleton';
import type { Client } from '@/hooks/useClients';

interface ClientsListProps {
  clients?: Client[];
}

export const ClientsList: React.FC<ClientsListProps> = ({ clients: propClients }) => {
  const { clients: hookClients, loading, refetch } = useClients();
  const clients = propClients || hookClients;
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setDetailsOpen(true);
  };

  const handleDetailsClose = () => {
    setDetailsOpen(false);
    setSelectedClient(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            👥
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No clients yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Your clients will appear here once you start creating onboarding links or receiving requests.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={() => handleClientClick(client)}
            />
          ))}
        </div>
      </div>

        <ClientDetailsSheet 
          client={selectedClient} 
          open={detailsOpen} 
          onOpenChange={setDetailsOpen}
          onClose={handleDetailsClose}
          onClientUpdated={refetch}
        />
    </>
  );
};