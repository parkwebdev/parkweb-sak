/**
 * Get Started Wrapper
 * 
 * Wrapper component for the Get Started page with page transition.
 * 
 * @module pages/GetStartedWrapper
 */

import React from 'react';
import { GetStarted } from './GetStarted';
import { PageTransition } from '@/components/ui/page-transition';

const GetStartedWrapper: React.FC = () => {
  return (
    <PageTransition>
      <GetStarted />
    </PageTransition>
  );
};

export default GetStartedWrapper;
