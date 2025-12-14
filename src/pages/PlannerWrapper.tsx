import React from 'react';
import Planner from './Planner';
import { PageTransition } from '@/components/ui/page-transition';

const PlannerWrapper = () => {
  return (
    <PageTransition>
      <Planner />
    </PageTransition>
  );
};

export default PlannerWrapper;
