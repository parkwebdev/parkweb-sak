import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        
        <div className="flex-1 flex flex-col">
          <Header />
          
          <main className="flex-1 overflow-auto p-4">
            <div className="h-full rounded-xl bg-muted/30 border border-border shadow-sm">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
