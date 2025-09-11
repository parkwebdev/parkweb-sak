import React from 'react';
import { ClientsHeader } from '@/components/clients/ClientsHeader';
import { ClientsList } from '@/components/clients/ClientsList';

export default function Clients() {
  return (
    <div className="flex flex-col h-full">
      <ClientsHeader />
      <div className="flex-1 overflow-hidden">
        <ClientsList />
      </div>
    </div>
  );
}