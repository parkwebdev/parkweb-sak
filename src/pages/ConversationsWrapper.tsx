/**
 * ConversationsWrapper
 * 
 * Lazy-loading wrapper for the Conversations page.
 * Reduces initial bundle size by code-splitting this heavy component.
 * 
 * @module pages/ConversationsWrapper
 */

import { lazy, Suspense } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { SkeletonChatPage } from '@/components/ui/page-skeleton';

const Conversations = lazy(() => import('./Conversations'));

const ConversationsWrapper = () => {
  return (
    <PageTransition>
      <Suspense fallback={<SkeletonChatPage className="min-h-[400px]" />}>
        <Conversations />
      </Suspense>
    </PageTransition>
  );
};

export default ConversationsWrapper;
