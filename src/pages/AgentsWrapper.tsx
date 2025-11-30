import React from 'react';
import Agents from './Agents';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageTransition } from '@/components/ui/page-transition';

const AgentsWrapper = () => {
  return (
    <AppLayout>
      <PageTransition>
        <Agents />
      </PageTransition>
    </AppLayout>
  );
};

export default AgentsWrapper;
