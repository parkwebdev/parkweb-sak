/**
 * @fileoverview Kanban board view for leads organized by status.
 * Supports drag-and-drop to update lead status.
 */

import { useMemo, useCallback } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { formatDistanceToNow } from "date-fns";
import { Mail01, Phone, Building02, Eye } from "@untitledui/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
  KanbanOverlay,
} from "@/components/ui/kanban";
import type { Tables, Enums } from "@/integrations/supabase/types";

// Column configuration with design system colors
const COLUMNS = [
  { id: "new", name: "New", colorClass: "bg-blue-500", textClass: "text-blue-500" },
  { id: "contacted", name: "Contacted", colorClass: "bg-purple-500", textClass: "text-purple-500" },
  { id: "qualified", name: "Qualified", colorClass: "bg-green-500", textClass: "text-green-500" },
  { id: "converted", name: "Converted", colorClass: "bg-status-active", textClass: "text-status-active" },
  { id: "lost", name: "Lost", colorClass: "bg-muted-foreground", textClass: "text-muted-foreground" },
] as const;

type LeadStatus = (typeof COLUMNS)[number]["id"];

interface LeadWithColumn extends Tables<"leads"> {
  column: LeadStatus;
}

interface LeadsKanbanBoardProps {
  leads: Tables<"leads">[];
  onStatusChange: (leadId: string, status: Enums<"lead_status">) => void;
  onViewLead: (lead: Tables<"leads">) => void;
}

/**
 * LeadKanbanCard - Individual lead card for kanban
 */
function LeadKanbanCard({
  lead,
  onView,
}: {
  lead: Tables<"leads">;
  onView: (lead: Tables<"leads">) => void;
}) {
  const column = COLUMNS.find((c) => c.id === lead.status);
  const statusColors: Record<string, string> = {
    new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    contacted: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    qualified: "bg-green-500/10 text-green-500 border-green-500/20",
    converted: "bg-status-active/10 text-status-active border-status-active/20",
    lost: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-sm truncate">{lead.name || "Unknown"}</h4>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`${statusColors[lead.status] || statusColors.new} text-2xs capitalize shrink-0`}
        >
          {lead.status}
        </Badge>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        {lead.email && (
          <div className="flex items-center gap-1.5 truncate">
            <Mail01 size={12} className="shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-1.5">
            <Phone size={12} className="shrink-0" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.company && (
          <div className="flex items-center gap-1.5 truncate">
            <Building02 size={12} className="shrink-0" />
            <span className="truncate">{lead.company}</span>
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full h-7 text-xs mt-1"
        onClick={(e) => {
          e.stopPropagation();
          onView(lead);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Eye size={14} className="mr-1.5" />
        View Details
      </Button>
    </div>
  );
}

/**
 * LeadsKanbanBoard - Main kanban component for leads
 */
export function LeadsKanbanBoard({
  leads,
  onStatusChange,
  onViewLead,
}: LeadsKanbanBoardProps) {
  // Transform leads to include column property
  const kanbanLeads: LeadWithColumn[] = useMemo(
    () =>
      leads.map((lead) => ({
        ...lead,
        column: lead.status as LeadStatus,
      })),
    [leads]
  );

  // Get cards for a specific column
  const getColumnCards = useCallback(
    (columnId: string) => kanbanLeads.filter((lead) => lead.column === columnId),
    [kanbanLeads]
  );

  // Handle drag end - update lead status
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) return;

      const leadId = active.id as string;
      const overId = over.id as string;

      // Determine the target column
      // overId could be a column ID or another card ID
      let targetColumn: string;

      // Check if dropped on a column
      const isColumn = COLUMNS.some((col) => col.id === overId);
      if (isColumn) {
        targetColumn = overId;
      } else {
        // Dropped on a card - find that card's column
        const targetCard = kanbanLeads.find((lead) => lead.id === overId);
        if (!targetCard) return;
        targetColumn = targetCard.column;
      }

      // Find the dragged lead
      const draggedLead = kanbanLeads.find((lead) => lead.id === leadId);
      if (!draggedLead || draggedLead.column === targetColumn) return;

      // Update the status
      onStatusChange(leadId, targetColumn as Enums<"lead_status">);
    },
    [kanbanLeads, onStatusChange]
  );

  // Find active lead for overlay
  const [activeId, setActiveId] = useMemo(() => [null, () => {}], []);
  const activeLead = useMemo(
    () => kanbanLeads.find((lead) => lead.id === activeId),
    [kanbanLeads, activeId]
  );

  return (
    <ScrollArea className="w-full">
      <KanbanProvider
        columns={COLUMNS as unknown as { id: string }[]}
        cards={kanbanLeads}
        onDragEnd={handleDragEnd}
        getCardColumn={(card) => card.column}
        className="min-w-max pb-4"
      >
        {COLUMNS.map((column) => {
          const columnCards = getColumnCards(column.id);
          return (
            <KanbanBoard key={column.id} id={column.id}>
              <KanbanHeader variant="accent" accentColor={`hsl(var(--${column.id === "new" ? "info" : column.id === "contacted" ? "chart-4" : column.id === "qualified" ? "success" : column.id === "converted" ? "status-active" : "muted-foreground"}))`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${column.colorClass}`} />
                  <span className="font-medium text-sm">{column.name}</span>
                  <Badge variant="secondary" className="text-2xs h-5 px-1.5">
                    {columnCards.length}
                  </Badge>
                </div>
              </KanbanHeader>
              <KanbanCards cards={columnCards}>
                {(lead) => (
                  <KanbanCard key={lead.id} id={lead.id}>
                    <LeadKanbanCard lead={lead} onView={onViewLead} />
                  </KanbanCard>
                )}
              </KanbanCards>
            </KanbanBoard>
          );
        })}

        {activeLead && (
          <KanbanOverlay>
            <div className="rounded-lg border bg-card p-3 shadow-lg w-[300px]">
              <LeadKanbanCard lead={activeLead} onView={() => {}} />
            </div>
          </KanbanOverlay>
        )}
      </KanbanProvider>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
