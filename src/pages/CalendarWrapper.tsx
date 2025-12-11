import React from 'react';
import Calendar from './Calendar';
import { PageTransition } from '@/components/ui/page-transition';

const CalendarWrapper = () => {
  return (
    <PageTransition>
      <Calendar />
    </PageTransition>
  );
};

export default CalendarWrapper;
