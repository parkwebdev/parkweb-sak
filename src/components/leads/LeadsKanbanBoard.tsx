/**
 * @fileoverview Kanban board for managing leads with drag-and-drop status updates.
 * Uses the shadcn kanban pattern with render props.
 */

import { useMemo, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Mail01, Phone, Building02, Eye } from "@untitledui/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from "@/components/ui/kanban";
import type { Tables, Enums } from "@/integrations/supabase/types";

// Column definitions with status mapping and colors
const COLUMNS = [
  { id: "new", name: "New", colorClass: "bg-blue-500" },
  { id: "contacted", name: "Contacted", colorClass: "bg-purple-500" },
  { id: "qualified", name: "Qualified", colorClass: "bg-emerald-500" },
  { id: "converted", name: "Converted", colorClass: "bg-green-600" },
  { id: "lost", name: "Lost", colorClass: "bg-muted-foreground" },
] as const;

type LeadStatus = (typeof COLUMNS)[number]["id"];

// Kanban-compatible lead type
type KanbanLead = {
  id: string;
  name: string;
  column: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  created_at: string;
};

interface LeadsKanbanBoardProps {
  leads: Tables<"leads">[];
  onStatusChange: (leadId: string, status: Enums<"lead_status">) => void;
  onViewLead: (lead: Tables<"leads">) => void;
  onOrderChange?: (updates: { id: string; kanban_order: number; status?: Enums<"lead_status"> }[]) => void;
}

// Individual lead card content - exported for use in overlay
export function LeadCardContent({
  lead,
  onView,
}: {
  lead: KanbanLead;
  onView: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {lead.name || "Unnamed Lead"}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        {lead.email && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail01 size={12} className="shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone size={12} className="shrink-0" />
            <span className="truncate">{lead.phone}</span>
          </div>
        )}
        {lead.company && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building02 size={12} className="shrink-0" />
            <span className="truncate">{lead.company}</span>
          </div>
        )}
      </div>

    </div>
  );
}

export function LeadsKanbanBoard({
  leads,
  onStatusChange,
  onViewLead,
  onOrderChange,
}: LeadsKanbanBoardProps) {
  // Transform leads to kanban format with column property
  const kanbanLeads = useMemo<KanbanLead[]>(
    () =>
      leads.map((lead) => ({
        id: lead.id,
        name: lead.name || "Unnamed Lead",
        column: lead.status,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        status: lead.status,
        created_at: lead.created_at,
      })),
    [leads]
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
            onStatusChange(item.id, item.column as Enums<"lead_status">);
            break;
          }
        }
        return;
      }

      // Build updates for all leads that changed position or column
      const updates: { id: string; kanban_order: number; status?: Enums<"lead_status"> }[] = [];
      
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
              ...(columnChanged && { status: item.column as Enums<"lead_status"> }),
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
        <LeadCardContent lead={lead} onView={() => {}} />
      </Card>
    ),
    []
  );

  return (
    <div className="w-full min-w-0">
      <div className="overflow-x-auto pb-4">
        <KanbanProvider
          columns={COLUMNS as unknown as { id: string; name: string }[]}
          data={kanbanLeads}
          onDataChange={handleDataChange}
          renderOverlay={renderCardOverlay}
        >
          {(column) => (
            <KanbanBoard key={column.id} id={column.id}>
              <KanbanHeader>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      COLUMNS.find((c) => c.id === column.id)?.colorClass
                    }`}
                  />
                  <span className="text-sm font-medium">{column.name}</span>
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {getColumnCount(column.id)}
                  </Badge>
                </div>
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
                      onView={() => {
                        const originalLead = findOriginalLead(lead.id);
                        if (originalLead) {
                          onViewLead(originalLead);
                        }
                      }}
                    />
                  </KanbanCard>
                )}
              </KanbanCards>
            </KanbanBoard>
          )}
        </KanbanProvider>
      </div>
    </div>
  );
}
