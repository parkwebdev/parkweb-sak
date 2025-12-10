import React from 'react';
import Leads from './Leads';
import { PageTransition } from '@/components/ui/page-transition';

const LeadsWrapper = () => {
  return (
    <PageTransition>
      <Leads />
    </PageTransition>
  );
};

export default LeadsWrapper;
