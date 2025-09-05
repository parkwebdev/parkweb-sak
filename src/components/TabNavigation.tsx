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
    <div className="items-center border flex gap-0.5 text-sm text-[#717680] leading-none flex-wrap bg-neutral-50 mt-5 rounded-lg border-solid border-[#E9EAEB] max-md:max-w-full">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={`justify-center items-center flex min-h-9 gap-2 overflow-hidden my-auto px-3 py-2 rounded-lg ${
            activeTab === tab.id
              ? 'border shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] text-[#414651] bg-white border-solid border-[#D5D7DA]'
              : 'text-[#717680] hover:bg-white/50'
          }`}
        >
          <div className={`text-sm leading-5 self-stretch my-auto ${
            activeTab === tab.id ? 'text-[#414651]' : 'text-[#717680]'
          }`}>
            {tab.label}
          </div>
        </button>
      ))}
    </div>
  );
};
