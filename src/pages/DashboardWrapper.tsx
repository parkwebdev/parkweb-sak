import React from 'react';
import { Dashboard } from './Dashboard';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageTransition } from '@/components/ui/page-transition';

const DashboardWrapper = () => {
  return (
    <AppLayout>
      <PageTransition>
        <Dashboard />
      </PageTransition>
    </AppLayout>
  );
};

export default DashboardWrapper;