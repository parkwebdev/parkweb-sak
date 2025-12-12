/**
 * @fileoverview Dashboard tab navigation component with optional count badges.
 * Provides horizontal scrollable tabs for mobile and desktop views.
 */

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface DashboardTab {
  id: string;
  label: string;
  count?: number;
}

interface DashboardTabsProps {
  tabs: DashboardTab[];
  selectedTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function DashboardTabs({
  tabs,
  selectedTab,
  onTabChange,
  className,
}: DashboardTabsProps) {
  return (
    <div className={cn("-mx-4 px-4 lg:-mx-8 lg:px-8 overflow-x-auto border-b border-border pb-3", className)}>
      <Tabs value={selectedTab} onValueChange={onTabChange}>
        <TabsList className="h-auto bg-transparent p-0 gap-0.5">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none transition-colors"
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 rounded-full bg-muted-foreground/10 px-1.5 py-0.5 text-xs font-medium tabular-nums">
                  {tab.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
