import React, { useState } from 'react';
import { MainContent } from '@/components/MainContent';
import { Sidebar } from '@/components/Sidebar';
import { useSidebar } from '@/hooks/use-sidebar';

export default function Index() {
  return (
    <div className="bg-muted/30 min-h-full">
      <MainContent />
    </div>
  );
}
