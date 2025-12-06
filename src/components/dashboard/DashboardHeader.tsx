import { Download01, SwitchHorizontal01 } from "@untitledui/icons";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  title?: string;
  onExport?: () => void;
  onSwitchView?: () => void;
}

export function DashboardHeader({
  title = "Dashboard",
  onExport,
  onSwitchView,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl font-semibold text-foreground lg:text-2xl">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {onSwitchView && (
          <Button variant="outline" size="sm" onClick={onSwitchView}>
            <SwitchHorizontal01 className="mr-2 h-4 w-4" />
            Switch view
          </Button>
        )}
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download01 className="mr-2 h-4 w-4" />
            Export report
          </Button>
        )}
      </div>
    </div>
  );
}
