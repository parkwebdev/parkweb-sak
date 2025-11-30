import React from 'react';
import Conversations from './Conversations';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageTransition } from '@/components/ui/page-transition';

const ConversationsWrapper = () => {
  return (
    <AppLayout>
      <PageTransition>
        <Conversations />
      </PageTransition>
    </AppLayout>
  );
};

export default ConversationsWrapper;
