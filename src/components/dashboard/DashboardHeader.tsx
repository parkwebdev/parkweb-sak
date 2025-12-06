import { Download01 } from "@untitledui/icons";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  onExport?: () => void;
}

export function DashboardHeader({
  title = "Dashboard",
  subtitle,
  onExport,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground lg:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
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
