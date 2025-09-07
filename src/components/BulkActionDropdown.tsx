import React from 'react';
import { DotsHorizontal, Download01, CheckCircle, XCircle, Clock, File02 } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface BulkActionDropdownProps {
  selectedCount: number;
  onStatusUpdate: (status: string) => void;
  onExportSelected: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export const BulkActionDropdown: React.FC<BulkActionDropdownProps> = ({
  selectedCount,
  onStatusUpdate,
  onExportSelected,
  onDelete,
  disabled = false
}) => {
  if (selectedCount === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <DotsHorizontal size={16} />
          Bulk Actions
          <Badge variant="secondary" className="ml-1">
            {selectedCount}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem 
          onClick={onExportSelected}
          className="flex items-center gap-2"
        >
          <Download01 size={16} />
          Export Selected
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => onStatusUpdate('In Progress')}
          className="flex items-center gap-2"
        >
          <Clock size={16} />
          Mark In Progress
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => onStatusUpdate('Completed')}
          className="flex items-center gap-2"
        >
          <CheckCircle size={16} />
          Mark Completed
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => onStatusUpdate('Sent')}
          className="flex items-center gap-2"
        >
          <File02 size={16} />
          Mark as Sent
        </DropdownMenuItem>
        
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onDelete}
              className="flex items-center gap-2 text-destructive focus:text-destructive"
            >
              <XCircle size={16} />
              Delete Selected
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};