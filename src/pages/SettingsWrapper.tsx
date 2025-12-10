import React from 'react';
import Settings from './Settings';
import { PageTransition } from '@/components/ui/page-transition';

const SettingsWrapper = () => {
  return (
    <PageTransition>
      <Settings />
    </PageTransition>
  );
};

export default SettingsWrapper;
