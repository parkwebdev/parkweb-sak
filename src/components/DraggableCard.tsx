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

  // Add mock due date for demonstration
  const mockDueDate = sow.status === 'Draft' ? '2024-02-15' : sow.status === 'In Review' ? '2024-02-20' : '2024-02-25';

  return (
    <TooltipProvider>
      <div
        ref={setNodeRef}
        style={style}
        className={`bg-card border border-border rounded-lg p-3 transition-all cursor-pointer group ${
          isDragging ? 'opacity-50 shadow-lg' : 'hover:shadow-md'
        }`}
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
          
          <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(sow);
                  }}
                >
                  <Eye size={12} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View details</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(sow);
                  }}
                >
                  <Edit size={12} />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit scope</p>
              </TooltipContent>
            </Tooltip>
            
            {sow.status === 'Approved' && (onDownloadPDF || onDownloadDOC) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download size={12} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Download Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {onDownloadPDF && (
                    <DropdownMenuItem onClick={() => onDownloadPDF(sow)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </DropdownMenuItem>
                  )}
                  {onDownloadDOC && (
                    <DropdownMenuItem onClick={() => onDownloadDOC(sow)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download DOC
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Card Content */}
        <div className="mb-2">
          <div className="flex items-start justify-between mb-1.5">
            <h4 className="font-medium text-sm line-clamp-2 flex-1">{sow.title}</h4>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ClientAvatar name={sow.client} size="sm" />
            <span className="truncate">{sow.client}</span>
          </div>
        </div>

        {/* Due Date */}
        <div className="flex items-center gap-1 mb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                Due {formatDate(mockDueDate)}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Due date: {formatDate(mockDueDate)}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Badges */}
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

        {/* Footer */}
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

        {/* Integrations */}
        {showColumns.integrations && sow.integrations.length > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  {sow.integrations[0]}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Integration: {sow.integrations[0]}</p>
              </TooltipContent>
            </Tooltip>
            {sow.integrations.length > 1 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    +{sow.integrations.length - 1}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    <p>Additional integrations:</p>
                    {sow.integrations.slice(1).map((integration: string, index: number) => (
                      <p key={index} className="text-xs">• {integration}</p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Hover Preview (Expandable Content) */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 top-0 w-full h-full bg-card/95 backdrop-blur-sm rounded-lg p-3 pointer-events-none z-10">
          <div className="text-xs text-muted-foreground">
            <div className="font-medium mb-1">{sow.title}</div>
            <div className="line-clamp-3">{sow.content.substring(0, 150)}...</div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};