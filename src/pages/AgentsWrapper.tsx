import React from 'react';
import Agents from './Agents';
import { PageTransition } from '@/components/ui/page-transition';

const AgentsWrapper = () => {
  return (
    <PageTransition>
      <Agents />
    </PageTransition>
  );
};

export default AgentsWrapper;
