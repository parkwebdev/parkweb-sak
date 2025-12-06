import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  SearchMd,
  FilterLines,
  ChevronSelectorVertical,
  ArrowUp,
  ArrowDown,
  Trash01,
  Edit02,
  Calendar,
  Check,
} from "@untitledui/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SimpleDeleteDialog } from "@/components/ui/simple-delete-dialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardPagination } from "./DashboardPagination";
import { AnimatedTableRow } from "@/components/ui/animated-table-row";
import { cn } from "@/lib/utils";

export interface ConversationRow {
  id: string;
  agentName: string;
  leadName?: string;
  messageCount: number;
  duration: string;
  percentageOfTotal: number;
  status: "active" | "human_takeover" | "closed";
  createdAt: string;
}

interface TabConfig {
  id: string;
  label: string;
  count?: number;
}

interface ConversationsDataTableProps {
  data: ConversationRow[];
  tabs: TabConfig[];
  selectedTab: string;
  onTabChange: (tabId: string) => void;
  onDelete?: (ids: string[]) => Promise<void>;
  title?: string;
  className?: string;
  storageKey?: string;
}

type DateFilter = "all" | "today" | "7days" | "30days";

type SortColumn = "agentName" | "messageCount" | "duration" | "percentageOfTotal" | "status";
type SortDirection = "asc" | "desc";

interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

const statusConfig = {
  active: { label: "Active", className: "bg-success/10 text-success border-success/20" },
  human_takeover: { label: "Human", className: "bg-info/10 text-info border-info/20" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground border-border" },
};

const STORAGE_PREFIX = "dashboard_table_sort_";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function loadSortState(key: string): SortState | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.column && parsed.direction) return parsed as SortState;
    }
  } catch {}
  return null;
}

function saveSortState(key: string, state: SortState): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(state));
  } catch {}
}

export function ConversationsDataTable({
  data,
  tabs,
  selectedTab,
  onTabChange,
  onDelete,
  title = "Conversations",
  className,
  storageKey = "conversations",
}: ConversationsDataTableProps) {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [sortState, setSortState] = useState<SortState>(() => {
    const stored = loadSortState(storageKey);
    return stored || { column: "messageCount", direction: "desc" };
  });
  const [page, setPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 10;

  const dateFilterOptions = [
    { id: "all" as DateFilter, label: "All time" },
    { id: "today" as DateFilter, label: "Today" },
    { id: "7days" as DateFilter, label: "Last 7 days" },
    { id: "30days" as DateFilter, label: "Last 30 days" },
  ];

  useEffect(() => {
    saveSortState(storageKey, sortState);
  }, [sortState, storageKey]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const cutoff = new Date();
      if (dateFilter === "today") {
        cutoff.setHours(0, 0, 0, 0);
      } else if (dateFilter === "7days") {
        cutoff.setDate(now.getDate() - 7);
      } else if (dateFilter === "30days") {
        cutoff.setDate(now.getDate() - 30);
      }
      filtered = filtered.filter((row) => new Date(row.createdAt) >= cutoff);
    }

    // Apply search filter
    if (debouncedSearch.trim()) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter((row) =>
        row.agentName.toLowerCase().includes(searchLower) ||
        (row.leadName?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    return filtered;
  }, [data, debouncedSearch, dateFilter]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let comparison = 0;
      switch (sortState.column) {
        case "agentName":
          comparison = a.agentName.localeCompare(b.agentName);
          break;
        case "messageCount":
          comparison = a.messageCount - b.messageCount;
          break;
        case "percentageOfTotal":
          comparison = a.percentageOfTotal - b.percentageOfTotal;
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      return sortState.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortState]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, page]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = useCallback((column: SortColumn) => {
    setSortState((prev) => ({
      column,
      direction: prev.column === column && prev.direction === "desc" ? "asc" : "desc",
    }));
  }, []);

  // Selection handlers
  const allSelected = paginatedData.length > 0 && paginatedData.every(row => selectedRows.has(row.id));
  const someSelected = paginatedData.some(row => selectedRows.has(row.id)) && !allSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(row => row.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTarget(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete([deleteTarget]);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      selectedRows.delete(deleteTarget);
      setSelectedRows(new Set(selectedRows));
    } finally {
      setIsDeleting(false);
    }
  };

  // Sortable header with diamond icon
  const SortableHeader = ({ column, children }: { column: SortColumn; children: React.ReactNode }) => {
    const isActive = sortState.column === column;
    return (
      <button
        onClick={() => handleSort(column)}
        className="flex items-center gap-1 hover:text-foreground transition-colors group"
      >
        {children}
        <span className={cn(
          "transition-colors",
          isActive ? "text-foreground" : "text-muted-foreground/50 group-hover:text-muted-foreground"
        )}>
          {isActive ? (
            sortState.direction === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )
          ) : (
            <ChevronSelectorVertical className="h-3.5 w-3.5" />
          )}
        </span>
      </button>
    );
  };

  return (
    <Card className={cn("overflow-hidden border-border/50", className)}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>

      {/* Tabs + Search/Filter Row */}
      <div className="px-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Segmented Tabs */}
        <div className="flex items-center bg-muted/80 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap",
                selectedTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  "ml-1.5 text-xs",
                  selectedTab === tab.id ? "text-muted-foreground" : "text-muted-foreground/70"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchMd className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-4 h-9 w-[200px] bg-background"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <FilterLines className="h-4 w-4" />
                {dateFilter === "all" ? "Filters" : dateFilterOptions.find(o => o.id === dateFilter)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {dateFilterOptions.map((option) => (
                <DropdownMenuItem
                  key={option.id}
                  onClick={() => setDateFilter(option.id)}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {option.label}
                  </span>
                  {dateFilter === option.id && <Check className="h-4 w-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="border-t border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/50">
              <TableHead className="w-12 pl-5">
                <Checkbox
                  checked={allSelected || someSelected}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                <SortableHeader column="agentName">Agent / Lead</SortableHeader>
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                <SortableHeader column="messageCount">Messages</SortableHeader>
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Duration</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground min-w-[180px]">
                <SortableHeader column="percentageOfTotal">% of Total</SortableHeader>
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                <SortableHeader column="status">Status</SortableHeader>
              </TableHead>
              <TableHead className="w-24 text-xs font-medium text-muted-foreground pr-5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  {debouncedSearch ? "No matching conversations found" : "No conversations found"}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => {
                const config = statusConfig[row.status];
                return (
                  <AnimatedTableRow
                    key={row.id}
                    index={index}
                    className="group border-b border-border/30 hover:bg-muted/30"
                  >
                    <TableCell className="pl-5">
                      <Checkbox
                        checked={selectedRows.has(row.id)}
                        onCheckedChange={(checked) => handleSelectRow(row.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{row.agentName}</span>
                        {row.leadName && (
                          <span className="text-sm text-muted-foreground">{row.leadName}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {row.messageCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {row.duration}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 w-32">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full transition-all"
                            style={{ width: `${Math.min(row.percentageOfTotal, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm tabular-nums text-muted-foreground w-12 text-right">
                          {row.percentageOfTotal.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("font-medium border", config.className)}
                      >
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full mr-1.5",
                          row.status === "active" && "bg-success",
                          row.status === "human_takeover" && "bg-info",
                          row.status === "closed" && "bg-muted-foreground"
                        )} />
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => navigate(`/conversations?id=${row.id}`)}
                        >
                          <Edit02 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteClick(row.id)}
                        >
                          <Trash01 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </AnimatedTableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-border/50">
          <DashboardPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <SimpleDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Conversation"
        description="Are you sure you want to delete this conversation? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </Card>
  );
}
