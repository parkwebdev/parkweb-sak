/**
 * @fileoverview Kanban board for managing leads with drag-and-drop status updates.
 * Uses dynamic stages from the database with inline editing support.
 */

import React, { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { 
  Mail01, 
  Phone, 
  MarkerPin01, 
  Globe01, 
  Flag01, 
  MessageChatCircle,
  Edit05,
  Clock,
  Calendar
} from "@untitledui/icons";
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
import { useTeam } from '@/hooks/useTeam';
import { type CardFieldKey, getDefaultVisibleFields } from "./KanbanCardFields";
import { LeadAssigneeAvatar } from './LeadAssigneeSelector';
import type { Tables } from "@/integrations/supabase/types";
import type { SortOption } from "@/components/leads/LeadsViewSettingsSheet";
import type { ConversationMetadata } from "@/types/metadata";

// Kanban-compatible lead type with extended fields
type KanbanLead = {
  id: string;
  name: string;
  column: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  stage_id: string | null;
  created_at: string;
  updated_at: string;
  hasConversation: boolean;
  assigned_to: string | null;
  // From conversation metadata
  location: string | null;
  entryPage: string | null;
  priority: 'high' | 'medium' | 'low' | null;
  tags: string[];
  notes: string | null;
};

// Extended lead type that includes conversation (matching useLeads hook)
type LeadWithConversation = Tables<"leads"> & {
  conversations?: { 
    id: string; 
    created_at: string;
    metadata?: unknown;
  } | null;
};

interface LeadsKanbanBoardProps {
  leads: LeadWithConversation[];
  onStatusChange: (leadId: string, stageId: string) => void;
  onViewLead: (lead: Tables<"leads">) => void;
  onOrderChange?: (updates: { id: string; kanban_order: number; stage_id?: string }[]) => void;
  visibleFields?: Set<CardFieldKey>;
  /** Whether the user can manage (edit, drag) leads. Controls DnD and stage editing. */
  canManage?: boolean;
  /** Sort option for ordering leads within each column */
  sortOption?: SortOption | null;
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

  // Check if onUpdate was provided (means user can manage)
  const canEdit = !!onUpdate;

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: stage.color }}
      />
      {isEditing && canEdit ? (
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
      ) : canEdit ? (
        <button
          onClick={() => setIsEditing(true)}
          className="text-sm font-medium hover:text-primary transition-colors"
        >
          {stage.name}
        </button>
      ) : (
        <span className="text-sm font-medium">{stage.name}</span>
      )}
      <Badge variant="secondary" className="h-5 px-1.5 text-xs">
        {count}
      </Badge>
    </div>
  );
}

// Priority badge component
function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const config = {
    high: { label: 'High', className: 'bg-destructive/10 text-destructive border-destructive/20' },
    medium: { label: 'Medium', className: 'bg-warning/10 text-warning border-warning/20' },
    low: { label: 'Low', className: 'bg-muted text-muted-foreground border-border' },
  };
  
  const { label, className } = config[priority];
  
  return (
    <Badge variant="outline" className={`h-5 text-2xs px-1.5 ${className}`}>
      <Flag01 size={10} className="mr-0.5" />
      {label}
    </Badge>
  );
}

// Helper to extract domain/path from URL
function formatEntryPage(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.pathname === '/' ? parsed.hostname : `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return url.slice(0, 30);
  }
}


// Individual lead card content - memoized for performance
export const LeadCardContent = React.memo(function LeadCardContent({ 
  lead,
  visibleFields = getDefaultVisibleFields(),
  teamMembers = [],
}: { 
  lead: KanbanLead;
  visibleFields?: Set<CardFieldKey>;
  teamMembers?: { user_id: string; display_name: string | null; avatar_url: string | null }[];
}) {
  // Build display name from first/last name fields
  const displayName = useMemo(() => {
    const parts: string[] = [];
    if (visibleFields.has('firstName') && lead.firstName) parts.push(lead.firstName);
    if (visibleFields.has('lastName') && lead.lastName) parts.push(lead.lastName);
    return parts.length > 0 ? parts.join(' ') : lead.name || 'Unnamed Lead';
  }, [lead.firstName, lead.lastName, lead.name, visibleFields]);

  return (
    <div className="space-y-2">
      {/* Header: Name */}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {displayName}
        </p>
      </div>

      {/* Contact Info */}
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
      </div>

      {/* Session Details */}
      {(visibleFields.has('location') || visibleFields.has('entryPage')) && (
        <div className="space-y-1">
          {visibleFields.has('location') && lead.location && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MarkerPin01 size={12} className="shrink-0" />
              <span className="truncate">{lead.location}</span>
            </div>
          )}
          {visibleFields.has('entryPage') && lead.entryPage && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe01 size={12} className="shrink-0" />
              <span className="truncate">{lead.entryPage}</span>
            </div>
          )}
        </div>
      )}

      {/* Priority, Tags & Assignee */}
      {(visibleFields.has('priority') || visibleFields.has('tags') || visibleFields.has('assignee')) && (
        <div className="flex flex-wrap items-center gap-1">
          {visibleFields.has('priority') && lead.priority && (
            <PriorityBadge priority={lead.priority} />
          )}
          {visibleFields.has('tags') && lead.tags.length > 0 && (
            <>
              {lead.tags.slice(0, 3).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="h-5 text-2xs px-1.5"
                >
                  {tag}
                </Badge>
              ))}
              {lead.tags.length > 3 && (
                <span className="text-2xs text-muted-foreground">
                  +{lead.tags.length - 3}
                </span>
              )}
            </>
          )}
          {visibleFields.has('assignee') && lead.assigned_to && (
            <LeadAssigneeAvatar 
              assignedTo={lead.assigned_to} 
              teamMembers={teamMembers} 
              size="sm" 
            />
          )}
        </div>
      )}

      {/* Notes Preview */}
      {visibleFields.has('notes') && lead.notes && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Edit05 size={12} className="shrink-0 mt-0.5" />
          <span className="line-clamp-2">{lead.notes}</span>
        </div>
      )}

      {/* Timestamps */}
      {(visibleFields.has('createdAt') || visibleFields.has('lastUpdated')) && (
        <div className="flex flex-wrap gap-2 text-2xs text-muted-foreground">
          {visibleFields.has('createdAt') && (
            <div className="flex items-center gap-1">
              <Calendar size={10} />
              <span>{formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}</span>
            </div>
          )}
          {visibleFields.has('lastUpdated') && (
            <div className="flex items-center gap-1">
              <Clock size={10} />
              <span>Updated {formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export function LeadsKanbanBoard({
  leads,
  onStatusChange,
  onViewLead,
  onOrderChange,
  visibleFields = getDefaultVisibleFields(),
  canManage = true,
  sortOption,
}: LeadsKanbanBoardProps) {
  const { stages, loading: stagesLoading, updateStage } = useLeadStages();
  const { teamMembers } = useTeam();

  // Build columns from stages
  const columns = useMemo(() => 
    stages.map(stage => ({
      id: stage.id,
      name: stage.name,
    })),
    [stages]
  );

  // Transform leads to kanban format with extended data extraction
  const kanbanLeads = useMemo<KanbanLead[]>(() => {
    const mapped = leads.map((lead) => {
      // Find matching stage - fallback to first stage if not found
      const stageId = lead.stage_id || stages.find(s => s.is_default)?.id || stages[0]?.id || '';
      
      // Extract data from lead.data JSONB field
      const leadData = (lead.data || {}) as Record<string, unknown>;
      const firstName = (leadData.firstName as string) || (leadData['First Name'] as string) || null;
      const lastName = (leadData.lastName as string) || (leadData['Last Name'] as string) || null;
      
      // Get phone from column OR data field
      const phone = lead.phone || (leadData['Phone Number'] as string) || (leadData.phone as string) || null;
      
      // Extract conversation metadata
      const conversation = (lead as LeadWithConversation).conversations;
      const metadata = (conversation?.metadata || {}) as ConversationMetadata;
      
      // Build location string
      const locationParts: string[] = [];
      if (metadata.city) locationParts.push(metadata.city);
      if (metadata.country) locationParts.push(metadata.country);
      const location = locationParts.length > 0 ? locationParts.join(', ') : null;
      
      // Format entry page
      const entryPage = formatEntryPage(metadata.referrer_journey?.landing_page);
      
      // Map priority from ConversationMetadata to KanbanLead format
      let priority: 'high' | 'medium' | 'low' | null = null;
      if (metadata.priority) {
        // Map 'normal' → 'medium', 'urgent' → 'high', ignore 'not_set'
        const priorityMap: Record<string, 'high' | 'medium' | 'low' | null> = {
          'high': 'high',
          'urgent': 'high',
          'normal': 'medium',
          'low': 'low',
          'not_set': null,
        };
        priority = priorityMap[metadata.priority] ?? null;
      }
      
      return {
        id: lead.id,
        name: lead.name || "Unnamed Lead",
        column: stageId,
        firstName,
        lastName,
        email: lead.email,
        phone,
        stage_id: lead.stage_id,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        hasConversation: !!lead.conversation_id,
        assigned_to: lead.assigned_to || null,
        location,
        entryPage,
        priority,
        tags: metadata.tags || [],
        notes: metadata.notes || null,
      };
    });

    // Apply sorting if sortOption is provided
    if (sortOption) {
      const { column, direction } = sortOption;
      const multiplier = direction === 'asc' ? 1 : -1;
      
      mapped.sort((a, b) => {
        let aVal: string | null = null;
        let bVal: string | null = null;
        
        switch (column) {
          case 'name':
            aVal = a.name?.toLowerCase() ?? '';
            bVal = b.name?.toLowerCase() ?? '';
            break;
          case 'email':
            aVal = a.email?.toLowerCase() ?? '';
            bVal = b.email?.toLowerCase() ?? '';
            break;
          case 'created_at':
            aVal = a.created_at;
            bVal = b.created_at;
            break;
          case 'updated_at':
            aVal = a.updated_at;
            bVal = b.updated_at;
            break;
          default:
            return 0;
        }
        
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === '') return 1;
        if (bVal === null || bVal === '') return -1;
        return aVal < bVal ? -1 * multiplier : 1 * multiplier;
      });
    }

    return mapped;
  }, [leads, stages, sortOption]);

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
        <LeadCardContent lead={lead} visibleFields={visibleFields} teamMembers={teamMembers} />
      </Card>
    ),
    [visibleFields, teamMembers]
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
          onDataChange={canManage ? handleDataChange : undefined}
          renderOverlay={renderCardOverlay}
        >
          {(column) => {
            const stage = stages.find(s => s.id === column.id);
            if (!stage) return null;

            return (
              <KanbanBoard key={column.id} id={column.id} stageColor={stage.color}>
                <KanbanHeader>
                  <InlineStageHeader
                    stage={stage}
                    count={getColumnCount(column.id)}
                    onUpdate={canManage ? handleStageUpdate : undefined as unknown as typeof handleStageUpdate}
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
                      <LeadCardContent lead={lead} visibleFields={visibleFields} teamMembers={teamMembers} />
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
