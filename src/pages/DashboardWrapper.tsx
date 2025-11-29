import React from 'react';
import { Dashboard } from './Dashboard';
import { AppLayout } from '@/components/AppLayout';

const DashboardWrapper = () => {
  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
};

export default DashboardWrapper;