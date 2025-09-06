import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { useSidebar } from '@/hooks/use-sidebar';

const Settings = () => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full z-30 transition-transform duration-300 lg:translate-x-0">
        <Sidebar />
      </div>
      
      {/* Main content */}
      <div className={`flex-1 overflow-auto min-h-screen transition-all duration-300 ${
        isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'
      }`}>
        <main className="flex-1 bg-muted/30 min-h-screen pt-4 lg:pt-8 pb-12">
          <div className="max-w-6xl mx-auto px-4 lg:px-8">
            {/* Header */}
            <header className="mb-6">
              <h1 className="text-2xl font-semibold leading-tight mb-1">
                Settings
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your account settings and preferences
              </p>
            </header>

            {/* Settings Content */}
            <div className="grid gap-6">
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">General Settings</h2>
                <p className="text-muted-foreground">Configure your general account settings and preferences.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;