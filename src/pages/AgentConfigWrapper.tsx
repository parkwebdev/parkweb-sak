import React from 'react';
import AgentConfig from './AgentConfig';
import { PageTransition } from '@/components/ui/page-transition';

const AgentConfigWrapper = () => {
  return (
    <PageTransition>
      <AgentConfig />
    </PageTransition>
  );
};

export default AgentConfigWrapper;
