import React from 'react';
import Analytics from './Analytics';
import { PageTransition } from '@/components/ui/page-transition';

const AnalyticsWrapper = () => {
  return (
    <PageTransition>
      <Analytics />
    </PageTransition>
  );
};

export default AnalyticsWrapper;
