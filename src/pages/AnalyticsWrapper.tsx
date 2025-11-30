import React from 'react';
import Analytics from './Analytics';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageTransition } from '@/components/ui/page-transition';

const AnalyticsWrapper = () => {
  return (
    <AppLayout>
      <PageTransition>
        <Analytics />
      </PageTransition>
    </AppLayout>
  );
};

export default AnalyticsWrapper;
