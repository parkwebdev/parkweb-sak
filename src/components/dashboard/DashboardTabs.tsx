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
    <div className={cn("-mx-4 px-4 lg:-mx-8 lg:px-8 overflow-x-auto", className)}>
      <Tabs value={selectedTab} onValueChange={onTabChange}>
        <TabsList className="h-auto bg-transparent p-0 gap-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
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
