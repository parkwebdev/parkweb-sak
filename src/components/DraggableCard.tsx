import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Eye, 
  Edit01 as Edit, 
  Download01 as Download,
  Check
} from '@untitledui/icons';
import { Badge } from '@/components/Badge';
import { ClientAvatar } from '@/components/ClientAvatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from '@/lib/status-helpers';

interface DraggableCardProps {
  sow: any;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onView: (sow: any) => void;
  onEdit: (sow: any) => void;
  onDownloadPDF?: (sow: any) => void;
  onDownloadDOC?: (sow: any) => void;
  showColumns: {
    client: boolean;
    projectType: boolean;
    industry: boolean;
    status: boolean;
    pages: boolean;
    integrations: boolean;
    dateModified: boolean;
    actions: boolean;
  };
}

export const DraggableCard: React.FC<DraggableCardProps> = ({
  sow,
  isSelected,
  onToggleSelection,
  onView,
  onEdit,
  onDownloadPDF,
  onDownloadDOC,
  showColumns
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sow.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Calculate estimated due date based on project creation date and status
  const getDueDate = (status: string, createdDate: string) => {
    const created = new Date(createdDate);
    const daysToAdd = status === 'Draft' ? 7 : status === 'Client Review' || status === 'Agency Review' ? 14 : 21;
    const dueDate = new Date(created);
    dueDate.setDate(dueDate.getDate() + daysToAdd);
    return dueDate.toISOString().split('T')[0];
  };

  const dueDate = getDueDate(sow.status, sow.date_created);

  return (
    <TooltipProvider>
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-card border border-border rounded-lg p-3 transition-all cursor-pointer ${
          isDragging ? 'opacity-50 shadow-lg' : 'hover:shadow-md'
        }`}
        onClick={() => onView(sow)}
        {...attributes}
        {...listeners}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between mb-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelection(sow.id);
            }}
            className="flex items-center justify-center w-4 mt-0.5"
          >
            <div className={`border flex min-h-4 w-4 h-4 rounded border-solid border-border items-center justify-center ${
              isSelected ? 'bg-primary border-primary' : 'bg-background'
            }`}>
              {isSelected && (
                <Check size={10} className="text-primary-foreground" />
              )}
            </div>
          </button>
        </div>

        {/* Card Content */}
        <div className="mb-3">
          <h4 className="font-medium text-sm line-clamp-2 mb-2">{sow.client}</h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <ClientAvatar name={sow.client} size="sm" />
            <span className="truncate">{sow.client}</span>
          </div>
        </div>

        {/* Due Date */}
        {dueDate && (
          <div className="mb-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Due {formatDate(dueDate)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Estimated due date: {formatDate(dueDate)}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Badges - Only show if enabled and available */}
        {(showColumns.projectType || showColumns.industry) && (
          <div className="flex flex-wrap gap-1 mb-2">
            {showColumns.projectType && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                {sow.projectType}
              </Badge>
            )}
            {showColumns.industry && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                {sow.industry}
              </Badge>
            )}
          </div>
        )}

        {/* Footer - Minimal info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {showColumns.pages && <span>{sow.pages} pages</span>}
          {showColumns.dateModified && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>{formatDate(sow.dateModified)}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Last modified: {formatDate(sow.dateModified)}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Integrations - Only show first one */}
        {showColumns.integrations && sow.integrations.length > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  {sow.integrations[0]}
                  {sow.integrations.length > 1 && ` +${sow.integrations.length - 1}`}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div>
                  <p>Integrations:</p>
                  {sow.integrations.map((integration: string, index: number) => (
                    <p key={index} className="text-xs">• {integration}</p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};