/**
 * @fileoverview Sheet for toggling table column visibility.
 * Allows users to customize which columns are displayed in data tables.
 */

import { Table } from '@tanstack/react-table';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface DataTableColumnsSheetProps<TData> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table<TData>;
}

export function DataTableColumnsSheet<TData>({
  open,
  onOpenChange,
  table,
}: DataTableColumnsSheetProps<TData>) {
  const hideableColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== 'undefined' && column.getCanHide()
    );

  const handleShowAll = () => {
    hideableColumns.forEach((column) => column.toggleVisibility(true));
  };
  
  const handleHideAll = () => {
    hideableColumns.forEach((column) => column.toggleVisibility(false));
  };

  const formatColumnName = (id: string) => {
    return id
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[340px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Table Columns</SheetTitle>
          <SheetDescription>
            Choose which columns to display in the table
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6 space-y-2">
          {hideableColumns.map((column) => {
            const isChecked = column.getIsVisible();
            
            return (
              <label
                key={column.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                />
                <span className="text-sm">{formatColumnName(column.id)}</span>
              </label>
            );
          })}
        </div>
        
        <SheetFooter className="gap-2 sm:gap-2">
          <Button variant="outline" size="sm" onClick={handleShowAll}>
            Show All
          </Button>
          <Button variant="outline" size="sm" onClick={handleHideAll}>
            Hide All
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
