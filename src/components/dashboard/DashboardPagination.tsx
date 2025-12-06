import { ChevronLeft, ChevronRight } from "@untitledui/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function DashboardPagination({
  page,
  totalPages,
  onPageChange,
  className,
}: DashboardPaginationProps) {
  return (
    <div className={cn("flex items-center justify-between px-5 py-3", className)}>
      {/* Page indicator on the left */}
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>

      {/* Navigation buttons on the right */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-8 gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-8 gap-1.5"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
