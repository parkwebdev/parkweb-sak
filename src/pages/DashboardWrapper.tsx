import React from 'react';
import { Dashboard } from './Dashboard';
import { PageTransition } from '@/components/ui/page-transition';

const DashboardWrapper = () => {
  return (
    <PageTransition>
      <Dashboard />
    </PageTransition>
  );
};

export default DashboardWrapper;
