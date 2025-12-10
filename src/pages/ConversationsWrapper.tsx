import React from 'react';
import Conversations from './Conversations';
import { PageTransition } from '@/components/ui/page-transition';

const ConversationsWrapper = () => {
  return (
    <PageTransition>
      <Conversations />
    </PageTransition>
  );
};

export default ConversationsWrapper;
