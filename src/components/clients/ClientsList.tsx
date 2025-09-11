import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients } from '@/hooks/useClients';
import { ClientCard } from './ClientCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { Client } from '@/hooks/useClients';

interface ClientsListProps {}

export const ClientsList: React.FC<ClientsListProps> = () => {
  const { clients, loading, refetch } = useClients();
  const navigate = useNavigate();

  const handleClientClick = (client: Client) => {
    navigate(`/clients/${client.id}`);
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
    </>
  );
};