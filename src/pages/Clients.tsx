import React from 'react';
import { ClientsContent } from '@/components/clients/ClientsContent';

interface ClientsProps {
  onMenuClick?: () => void;
}

export const Clients: React.FC<ClientsProps> = ({ onMenuClick }) => {
  return <ClientsContent />;
};

export default Clients;