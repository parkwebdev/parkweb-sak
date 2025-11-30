import React from 'react';
import Settings from './Settings';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageTransition } from '@/components/ui/page-transition';

const SettingsWrapper = () => {
  return (
    <AppLayout>
      <PageTransition>
        <Settings />
      </PageTransition>
    </AppLayout>
  );
};

export default SettingsWrapper;
