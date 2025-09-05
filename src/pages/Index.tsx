import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';

const Index = () => {
  return (
    <div className="items-stretch flex flex-wrap bg-white min-h-screen">
      <Sidebar />
      <MainContent />
    </div>
  );
};

export default Index;
