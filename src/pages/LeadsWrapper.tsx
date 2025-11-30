import React from 'react';
import Leads from './Leads';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageTransition } from '@/components/ui/page-transition';

const LeadsWrapper = () => {
  return (
    <AppLayout>
      <PageTransition>
        <Leads />
      </PageTransition>
    </AppLayout>
  );
};

export default LeadsWrapper;
