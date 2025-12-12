/**
 * @fileoverview Lead status dropdown with color-coded badges.
 * Provides status options: new, contacted, qualified, converted, lost.
 */

import { useState, useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from '@untitledui/icons';
import { SavedIndicator } from '@/components/settings/SavedIndicator';

interface LeadStatusDropdownProps {
  status: string;
  onStatusChange: (status: string) => void;
}

const statusOptions = [
  { value: 'new', label: 'New', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { value: 'contacted', label: 'Contacted', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  { value: 'qualified', label: 'Qualified', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  { value: 'converted', label: 'Converted', color: 'bg-success/10 text-success border-success/20' },
  { value: 'lost', label: 'Lost', color: 'bg-muted text-muted-foreground border-border' },
];

export const LeadStatusDropdown = ({ status, onStatusChange }: LeadStatusDropdownProps) => {
  const currentStatus = statusOptions.find((s) => s.value === status) || statusOptions[0];
  const [showSaved, setShowSaved] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout>();

  const handleStatusChange = (newStatus: string) => {
    onStatusChange(newStatus);
    
    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    // Show saved indicator after a brief delay
    saveTimerRef.current = setTimeout(() => {
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }, 500);
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1">
            <Badge variant="outline" className={currentStatus.color}>
              {currentStatus.label}
            </Badge>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-background z-50">
          {statusOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
            >
              <Badge variant="outline" className={option.color}>
                {option.label}
              </Badge>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <SavedIndicator show={showSaved} />
    </div>
  );
};
