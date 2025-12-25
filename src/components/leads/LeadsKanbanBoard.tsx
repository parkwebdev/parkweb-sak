/**
 * @fileoverview Kanban board for managing leads with drag-and-drop status updates.
 * Uses dynamic stages from the database with inline editing support.
 */

import React, { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Mail01, Phone, Building02, MessageChatCircle } from "@untitledui/icons";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from "@/components/ui/kanban";
import { useLeadStages, LeadStage } from "@/hooks/useLeadStages";
import { type CardFieldKey, getDefaultVisibleFields } from "./KanbanCardFields";
import type { Tables } from "@/integrations/supabase/types";

// Kanban-compatible lead type
type KanbanLead = {
  id: string;
  name: string;
  column: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  stage_id: string | null;
  created_at: string;
  hasConversation?: boolean;
};

interface LeadsKanbanBoardProps {
  leads: Tables<"leads">[];
  onStatusChange: (leadId: string, stageId: string) => void;
  onViewLead: (lead: Tables<"leads">) => void;
  onOrderChange?: (updates: { id: string; kanban_order: number; stage_id?: string }[]) => void;
  visibleFields?: Set<CardFieldKey>;
}

// Inline editable column header
function InlineStageHeader({
  stage,
  count,
  onUpdate,
}: {
  stage: LeadStage;
  count: number;
  onUpdate: (id: string, updates: Partial<Pick<LeadStage, 'name' | 'color'>>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(stage.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    if (editName.trim() && editName !== stage.name) {
      onUpdate(stage.id, { name: editName.trim() });
    } else {
      setEditName(stage.name);
    }
    setIsEditing(false);
  }, [editName, stage.id, stage.name, onUpdate]);

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: stage.color }}
      />
      {isEditing ? (
        <Input
          ref={inputRef}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setEditName(stage.name);
              setIsEditing(false);
            }
          }}
          className="h-6 w-24 text-sm font-medium px-1"
        />
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="text-sm font-medium hover:text-primary transition-colors"
        >
          {stage.name}
        </button>
      )}
      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
        {count}
      </Badge>
    </div>
  );
}

// Individual lead card content - memoized for performance
export const LeadCardContent = React.memo(function LeadCardContent({ 
  lead,
  visibleFields = getDefaultVisibleFields(),
}: { 
  lead: KanbanLead;
  visibleFields?: Set<CardFieldKey>;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {lead.name || "Unnamed Lead"}
          </p>
          {visibleFields.has('createdAt') && (
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
            </p>
          )}
        </div>
        {visibleFields.has('conversation') && lead.hasConversation && (
          <MessageChatCircle size={14} className="shrink-0 text-primary" />
        )}
      </div>

      <div className="space-y-1">
        {visibleFields.has('email') && lead.email && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail01 size={12} className="shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {visibleFields.has('phone') && lead.phone && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone size={12} className="shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </div>
        )}
        {visibleFields.has('company') && lead.company && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building02 size={12} className="shrink-0" />
            <span className="truncate">{lead.company}</span>
          </div>
        )}
      </div>
    </div>
  );
});

export function LeadsKanbanBoard({
  leads,
  onStatusChange,
  onViewLead,
  onOrderChange,
  visibleFields = getDefaultVisibleFields(),
}: LeadsKanbanBoardProps) {
  const { stages, loading: stagesLoading, updateStage } = useLeadStages();

  // Build columns from stages
  const columns = useMemo(() => 
    stages.map(stage => ({
      id: stage.id,
      name: stage.name,
    })),
    [stages]
  );

  // Transform leads to kanban format with stage_id as column
  const kanbanLeads = useMemo<KanbanLead[]>(
    () =>
      leads.map((lead) => {
        // Find matching stage - fallback to first stage if not found
        const stageId = lead.stage_id || stages.find(s => s.is_default)?.id || stages[0]?.id || '';
        
        return {
          id: lead.id,
          name: lead.name || "Unnamed Lead",
          column: stageId,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          stage_id: lead.stage_id,
          created_at: lead.created_at,
          hasConversation: !!lead.conversation_id,
        };
      }),
    [leads, stages]
  );

  // Get count for each column
  const getColumnCount = useCallback(
    (columnId: string) => kanbanLeads.filter((l) => l.column === columnId).length,
    [kanbanLeads]
  );

  // Find original lead by id
  const findOriginalLead = useCallback(
    (id: string) => leads.find((l) => l.id === id),
    [leads]
  );

  // Handle data changes from drag operations
  const handleDataChange = useCallback(
    (newData: KanbanLead[]) => {
      if (!onOrderChange) {
        // Fallback: only handle column changes via onStatusChange
        for (const item of newData) {
          const original = kanbanLeads.find((l) => l.id === item.id);
          if (original && original.column !== item.column) {
            onStatusChange(item.id, item.column);
            break;
          }
        }
        return;
      }

      // Build updates for all leads that changed position or column
      const updates: { id: string; kanban_order: number; stage_id?: string }[] = [];
      
      // Group new data by column to calculate order within each column
      const byColumn = new Map<string, KanbanLead[]>();
      for (const item of newData) {
        const list = byColumn.get(item.column) || [];
        list.push(item);
        byColumn.set(item.column, list);
      }

      // For each column, assign sequential order values
      for (const [column, items] of byColumn) {
        items.forEach((item, index) => {
          const original = kanbanLeads.find((l) => l.id === item.id);
          const originalIndex = kanbanLeads
            .filter((l) => l.column === column)
            .findIndex((l) => l.id === item.id);
          
          const columnChanged = original && original.column !== item.column;
          const orderChanged = originalIndex !== index;
          
          if (columnChanged || orderChanged) {
            updates.push({
              id: item.id,
              kanban_order: index + 1,
              ...(columnChanged && { stage_id: item.column }),
            });
          }
        });
      }

      if (updates.length > 0) {
        onOrderChange(updates);
      }
    },
    [kanbanLeads, onStatusChange, onOrderChange]
  );

  // Render overlay for dragged card
  const renderCardOverlay = useCallback(
    (lead: KanbanLead) => (
      <Card className="cursor-grabbing rounded-md border bg-card p-3 shadow-md">
        <LeadCardContent lead={lead} visibleFields={visibleFields} />
      </Card>
    ),
    [visibleFields]
  );

  // Handle stage name updates
  const handleStageUpdate = useCallback(
    (id: string, updates: Partial<Pick<LeadStage, 'name' | 'color'>>) => {
      updateStage(id, updates);
    },
    [updateStage]
  );

  // Loading state
  if (stagesLoading || stages.length === 0) {
    return (
      <div className="w-full min-w-0">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0 w-72">
              <div className="h-8 bg-muted animate-pulse rounded mb-2" />
              <div className="space-y-2">
                <div className="h-24 bg-muted animate-pulse rounded" />
                <div className="h-24 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <div className="overflow-x-auto pb-4">
        <KanbanProvider
          columns={columns}
          data={kanbanLeads}
          onDataChange={handleDataChange}
          renderOverlay={renderCardOverlay}
        >
          {(column) => {
            const stage = stages.find(s => s.id === column.id);
            if (!stage) return null;

            return (
              <KanbanBoard key={column.id} id={column.id}>
                <KanbanHeader>
                  <InlineStageHeader
                    stage={stage}
                    count={getColumnCount(column.id)}
                    onUpdate={handleStageUpdate}
                  />
                </KanbanHeader>
                <KanbanCards id={column.id}>
                  {(lead: KanbanLead) => (
                    <KanbanCard
                      key={lead.id}
                      id={lead.id}
                      name={lead.name}
                      column={lead.column}
                      onClick={() => {
                        const originalLead = findOriginalLead(lead.id);
                        if (originalLead) {
                          onViewLead(originalLead);
                        }
                      }}
                    >
                      <LeadCardContent lead={lead} visibleFields={visibleFields} />
                    </KanbanCard>
                  )}
                </KanbanCards>
              </KanbanBoard>
            );
          }}
        </KanbanProvider>
      </div>
    </div>
  );
}
