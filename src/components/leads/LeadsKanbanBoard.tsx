/**
 * @fileoverview Kanban board for managing leads with drag-and-drop status updates.
 * Uses dynamic stages from the database with inline editing support.
 */

import React, { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
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
import { StageProgressIcon } from "./StageProgressIcon";
import { useTeam } from '@/hooks/useTeam';
import { type CardFieldKey, getDefaultVisibleFields, CARD_FIELDS } from "./KanbanCardFields";
import { LeadAssigneePicker } from './LeadAssigneePicker';
import { PriorityBadge } from "@/components/ui/priority-badge";
import { SkeletonKanbanColumn } from "@/components/ui/skeleton";
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
  // From conversation metadata
  location: string | null;
  entryPage: string | null;
  /** Priority value from conversation metadata - passed to PriorityBadge which handles normalization */
  priority: string | null | undefined;
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
  onAddAssignee?: (leadId: string, userId: string) => void;
  onRemoveAssignee?: (leadId: string, userId: string) => void;
  getAssignees: (leadId: string) => string[];
  visibleFields?: Set<CardFieldKey>;
  /** Order of fields to display on cards */
  fieldOrder?: CardFieldKey[];
  /** Whether the user can manage (edit, drag) leads. Controls DnD and stage editing. */
  canManage?: boolean;
  /** Sort option for ordering leads within each column */
  sortOption?: SortOption | null;
}

// Inline editable column header
function InlineStageHeader({
  stage,
  count,
  stageIndex,
  totalStages,
  onUpdate,
}: {
  stage: LeadStage;
  count: number;
  stageIndex: number;
  totalStages: number;
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

  // Create contrasting text color based on background
  const getContrastColor = (hexColor: string) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#1a1a1a' : '#ffffff';
  };

  return (
    <div className="flex items-center gap-2">
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
          className="h-6 w-24 text-sm font-medium px-2"
        />
      ) : (
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide cursor-pointer hover:opacity-90 transition-opacity"
          style={{ 
            backgroundColor: stage.color,
            color: getContrastColor(stage.color),
          }}
          onClick={canEdit ? () => setIsEditing(true) : undefined}
        >
          <StageProgressIcon
            stageIndex={stageIndex}
            totalStages={totalStages}
            color={getContrastColor(stage.color)}
            size={14}
          />
          {stage.name}
        </div>
      )}
      <span className="text-sm font-medium text-muted-foreground">{count}</span>
    </div>
  );
}

// PriorityBadge is now imported from @/components/ui/priority-badge

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
  fieldOrder,
  assignees = [],
  onAddAssignee,
  onRemoveAssignee,
}: { 
  lead: KanbanLead;
  visibleFields?: Set<CardFieldKey>;
  fieldOrder?: CardFieldKey[];
  assignees?: string[];
  onAddAssignee?: (userId: string) => void;
  onRemoveAssignee?: (userId: string) => void;
}) {
  // Build display name from first/last name fields (always shown, not toggleable)
  const displayName = useMemo(() => {
    const parts: string[] = [];
    if (lead.firstName) parts.push(lead.firstName);
    if (lead.lastName) parts.push(lead.lastName);
    return parts.length > 0 ? parts.join(' ') : lead.name || 'Unnamed Lead';
  }, [lead.firstName, lead.lastName, lead.name]);

  // Default field order if not provided
  const orderedFields = fieldOrder || CARD_FIELDS.map(f => f.key);

  // Field renderers map
  const fieldRenderers: Partial<Record<CardFieldKey, () => React.ReactNode>> = useMemo(() => ({
    email: () => lead.email && (
      <div key="email" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Mail01 size={12} className="shrink-0" aria-hidden="true" />
        <span className="truncate">{lead.email}</span>
      </div>
    ),
    phone: () => lead.phone && (
      <div key="phone" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Phone size={12} className="shrink-0" aria-hidden="true" />
        <span className="truncate">{lead.phone}</span>
      </div>
    ),
    location: () => lead.location && (
      <div key="location" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MarkerPin01 size={12} className="shrink-0" aria-hidden="true" />
        <span className="truncate">{lead.location}</span>
      </div>
    ),
    entryPage: () => lead.entryPage && (
      <div key="entryPage" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Globe01 size={12} className="shrink-0" aria-hidden="true" />
        <span className="truncate">{lead.entryPage}</span>
      </div>
    ),
    priority: () => lead.priority && (
      <PriorityBadge key="priority" priority={lead.priority} />
    ),
    tags: () => lead.tags.length > 0 && (
      <React.Fragment key="tags">
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
      </React.Fragment>
    ),
    assignee: () => (
      <div key="assignee" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <LeadAssigneePicker
          leadId={lead.id}
          assignees={assignees}
          onAdd={(userId) => onAddAssignee?.(userId)}
          onRemove={(userId) => onRemoveAssignee?.(userId)}
          size="sm"
          disabled={!onAddAssignee}
        />
      </div>
    ),
    notes: () => lead.notes && (
      <div key="notes" className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <Edit05 size={12} className="shrink-0 mt-0.5" aria-hidden="true" />
        <span className="line-clamp-2">{lead.notes}</span>
      </div>
    ),
    createdAt: () => (
      <div key="createdAt" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Calendar size={12} aria-hidden="true" />
        <span>{formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}</span>
      </div>
    ),
    lastUpdated: () => (
      <div key="lastUpdated" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock size={12} aria-hidden="true" />
        <span>Updated {formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}</span>
      </div>
    ),
  }), [lead, assignees, onAddAssignee, onRemoveAssignee]);

  // Static header fields (not sortable): priority, tags (firstName/lastName always shown separately)
  const STATIC_HEADER_KEYS: CardFieldKey[] = ['priority', 'tags'];
  // Footer fields (not sortable): createdAt, lastUpdated
  const FOOTER_KEYS: CardFieldKey[] = ['createdAt', 'lastUpdated'];

  // Render sortable body fields (excludes header and footer fields)
  const bodyFields = orderedFields.filter(
    key => !STATIC_HEADER_KEYS.includes(key) && !FOOTER_KEYS.includes(key)
  );

  const renderedBodyFields = bodyFields
    .filter(key => visibleFields.has(key))
    .map(key => fieldRenderers[key]?.())
    .filter(Boolean);

  // Check if footer should be shown
  const showCreated = visibleFields.has('createdAt');
  const showLastUpdated = visibleFields.has('lastUpdated');
  const hasFooter = showCreated || showLastUpdated;

  return (
    <div className="space-y-2">
      {/* Header: Name on left, Priority + Tags on right */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {displayName}
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          {visibleFields.has('priority') && lead.priority && (
            <PriorityBadge priority={lead.priority} />
          )}
          {visibleFields.has('tags') && lead.tags.length > 0 && (
            <>
              {lead.tags.slice(0, 2).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="h-5 text-2xs px-1.5"
                >
                  {tag}
                </Badge>
              ))}
              {lead.tags.length > 2 && (
                <span className="text-2xs text-muted-foreground">
                  +{lead.tags.length - 2}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Body: Sortable fields in user's custom order */}
      {renderedBodyFields.length > 0 && (
        <div className="space-y-1.5">
          {renderedBodyFields}
        </div>
      )}

      {/* Footer: Created/Last Updated with divider (only if either is visible) */}
      {hasFooter && (
        <>
          <Separator className="!my-2" />
          <div className="flex items-center gap-3">
            {showCreated && fieldRenderers.createdAt?.()}
            {showLastUpdated && fieldRenderers.lastUpdated?.()}
          </div>
        </>
      )}
    </div>
  );
});

export function LeadsKanbanBoard({
  leads,
  onStatusChange,
  onViewLead,
  onOrderChange,
  onAddAssignee,
  onRemoveAssignee,
  getAssignees,
  visibleFields = getDefaultVisibleFields(),
  fieldOrder,
  canManage = true,
  sortOption,
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
      const entryPage = formatEntryPage(metadata.referrer_journey?.landing_page ?? undefined);
      
      // Pass priority through directly - PriorityBadge handles normalization
      const priority = metadata.priority ?? undefined;
      
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
        <LeadCardContent lead={lead} visibleFields={visibleFields} fieldOrder={fieldOrder} assignees={getAssignees(lead.id)} />
      </Card>
    ),
    [visibleFields, fieldOrder, getAssignees]
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
            <SkeletonKanbanColumn key={i} cards={2} />
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
                    stageIndex={stages.findIndex(s => s.id === column.id)}
                    totalStages={stages.length}
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
                      <LeadCardContent 
                        lead={lead} 
                        visibleFields={visibleFields}
                        fieldOrder={fieldOrder}
                        assignees={getAssignees(lead.id)}
                        onAddAssignee={canManage && onAddAssignee ? (userId) => onAddAssignee(lead.id, userId) : undefined}
                        onRemoveAssignee={canManage && onRemoveAssignee ? (userId) => onRemoveAssignee(lead.id, userId) : undefined}
                      />
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
