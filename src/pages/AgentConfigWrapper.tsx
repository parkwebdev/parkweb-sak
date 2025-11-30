import React from 'react';
import AgentConfig from './AgentConfig';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageTransition } from '@/components/ui/page-transition';

const AgentConfigWrapper = () => {
  return (
    <AppLayout>
      <PageTransition>
        <AgentConfig />
      </PageTransition>
    </AppLayout>
  );
};

export default AgentConfigWrapper;
