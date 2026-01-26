/**
 * Import/Export Dropdown
 * 
 * TopBar dropdown for importing and exporting prompt configurations.
 * 
 * @module components/admin/prompts/ImportExportDropdown
 */

import { ChevronDown, Download01, Upload01 } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { JsonExportIcon } from './JsonExportIcon';

interface ImportExportDropdownProps {
  onExport: () => void;
  onImport: () => void;
}

/**
 * Dropdown for importing and exporting prompt configurations as JSON.
 */
export function ImportExportDropdown({ onExport, onImport }: ImportExportDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 font-medium min-w-[130px] justify-between">
          <JsonExportIcon size={16} />
          <span>Import/Export</span>
          <ChevronDown size={16} className="text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" sideOffset={4} className="min-w-[130px]">
        <DropdownMenuItem onClick={onImport} className="gap-2">
          <Upload01 size={16} aria-hidden="true" />
          Import
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExport} className="gap-2">
          <Download01 size={16} aria-hidden="true" />
          Export
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
