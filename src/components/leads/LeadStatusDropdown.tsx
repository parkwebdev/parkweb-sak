/**
 * @fileoverview Lead status dropdown using dynamic stages from database.
 * Displays color-coded badges for each pipeline stage.
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
import { useLeadStages } from '@/hooks/useLeadStages';
import { Skeleton } from '@/components/ui/skeleton';

interface LeadStatusDropdownProps {
  stageId: string | null;
  onStageChange: (stageId: string) => void;
}

export const LeadStatusDropdown = ({ stageId, onStageChange }: LeadStatusDropdownProps) => {
  const { stages, loading } = useLeadStages();
  const [showSaved, setShowSaved] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout>();

  const currentStage = stages.find((s) => s.id === stageId) || stages.find(s => s.is_default) || stages[0];

  const handleStageChange = (newStageId: string) => {
    onStageChange(newStageId);
    
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

  if (loading || !currentStage) {
    return <Skeleton className="h-6 w-20" />;
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1">
            <Badge 
              variant="outline" 
              className="border-current"
              style={{ 
                backgroundColor: `${currentStage.color}15`,
                color: currentStage.color,
                borderColor: `${currentStage.color}30`,
              }}
            >
              {currentStage.name}
            </Badge>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-background z-50">
          {stages.map((stage) => (
            <DropdownMenuItem
              key={stage.id}
              onClick={() => handleStageChange(stage.id)}
            >
              <Badge 
                variant="outline"
                style={{ 
                  backgroundColor: `${stage.color}15`,
                  color: stage.color,
                  borderColor: `${stage.color}30`,
                }}
              >
                {stage.name}
              </Badge>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <SavedIndicator show={showSaved} />
    </div>
  );
};
