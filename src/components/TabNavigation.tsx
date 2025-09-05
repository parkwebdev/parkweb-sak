import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
}

interface TabNavigationProps {
  tabs: Tab[];
  defaultActiveTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  defaultActiveTab,
  onTabChange
}) => {
  const [activeTab, setActiveTab] = useState(defaultActiveTab || tabs[0]?.id);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className="items-center border flex gap-0.5 text-sm leading-none flex-wrap bg-muted mt-5 rounded-lg border-border max-md:max-w-full">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={`justify-center items-center flex min-h-9 gap-2 overflow-hidden my-auto px-3 py-2 rounded-lg ${
            activeTab === tab.id
              ? 'border shadow-sm text-foreground bg-background border-border'
              : 'text-muted-foreground hover:bg-background/50'
          }`}
        >
          <div className={`text-sm leading-5 self-stretch my-auto ${
            activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground'
          }`}>
            {tab.label}
          </div>
        </button>
      ))}
    </div>
  );
};
