/**
 * @fileoverview Event Type Dropdown Component
 * 
 * A dropdown selector for filtering calendar events by type.
 * Displays color-coded dots matching the event type legend.
 * 
 * @module components/calendar/EventTypeDropdown
 */

import { ChevronDown } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EVENT_TYPE_CONFIG } from '@/types/calendar';

interface EventTypeDropdownProps {
  /** Currently selected event type filter */
  activeType: string;
  /** Callback when type selection changes */
  onTypeChange: (type: string) => void;
}

const options = [
  { id: 'all', label: 'All Events', color: null },
  { id: 'showing', label: EVENT_TYPE_CONFIG.showing.label, color: EVENT_TYPE_CONFIG.showing.color },
  { id: 'move_in', label: EVENT_TYPE_CONFIG.move_in.label, color: EVENT_TYPE_CONFIG.move_in.color },
  { id: 'inspection', label: EVENT_TYPE_CONFIG.inspection.label, color: EVENT_TYPE_CONFIG.inspection.color },
  { id: 'maintenance', label: EVENT_TYPE_CONFIG.maintenance.label, color: EVENT_TYPE_CONFIG.maintenance.color },
];

/**
 * Dropdown for filtering calendar events by type.
 * Shows color-coded dots for each event type option.
 */
export function EventTypeDropdown({ activeType, onTypeChange }: EventTypeDropdownProps) {
  const activeOption = options.find(o => o.id === activeType) || options[0];
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {activeOption.color && (
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: activeOption.color }}
            />
          )}
          {activeOption.label}
          <ChevronDown size={14} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="space-y-0.5">
        {options.map(option => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => onTypeChange(option.id)}
            className={`gap-2 ${option.id === activeType ? 'bg-accent' : ''}`}
          >
            {option.color ? (
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: option.color }}
              />
            ) : (
              <span className="w-2 h-2" />
            )}
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
