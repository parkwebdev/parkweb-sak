import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  SearchLg,
  FilterLines,
  Eye,
  MessageChatCircle,
  ArrowUp,
  ArrowDown,
} from "@untitledui/icons";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardPagination } from "./DashboardPagination";
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

interface ConversationsDataTableProps {
  data: ConversationRow[];
  title?: string;
  className?: string;
  storageKey?: string;
}

type SortColumn = "agentName" | "messageCount" | "duration" | "percentageOfTotal" | "status";
type SortDirection = "asc" | "desc";

interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

const statusConfig = {
  active: { label: "Active", variant: "default" as const, className: "bg-success/10 text-success border-success/20" },
  human_takeover: { label: "Human", variant: "default" as const, className: "bg-info/10 text-info border-info/20" },
  closed: { label: "Closed", variant: "secondary" as const, className: "bg-muted text-muted-foreground" },
};

const STORAGE_PREFIX = "dashboard_table_sort_";

// Custom hook for debounced value
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Load sort state from localStorage
function loadSortState(key: string): SortState | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.column && parsed.direction) {
        return parsed as SortState;
      }
    }
  } catch {
    // Ignore parsing errors
  }
  return null;
}

// Save sort state to localStorage
function saveSortState(key: string, state: SortState): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export function ConversationsDataTable({
  data,
  title = "Conversations",
  className,
  storageKey = "conversations",
}: ConversationsDataTableProps) {
  const navigate = useNavigate();
  
  // Search with debouncing
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  
  // Sorting with persistence
  const [sortState, setSortState] = useState<SortState>(() => {
    const stored = loadSortState(storageKey);
    return stored || { column: "messageCount", direction: "desc" };
  });
  
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Persist sort state when it changes
  useEffect(() => {
    saveSortState(storageKey, sortState);
  }, [sortState, storageKey]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const filteredData = useMemo(() => {
    if (!debouncedSearch.trim()) return data;
    
    const searchLower = debouncedSearch.toLowerCase();
    return data.filter((row) => 
      row.agentName.toLowerCase().includes(searchLower) ||
      (row.leadName?.toLowerCase().includes(searchLower) ?? false)
    );
  }, [data, debouncedSearch]);

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

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortState.column !== column) return null;
    return sortState.direction === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  return (
    <Card className={cn("overflow-hidden border-border/50", className)}>
      {/* Table Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-4 lg:px-6">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {debouncedSearch && (
          <span className="text-sm text-muted-foreground">
            {filteredData.length} result{filteredData.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 border-b border-border bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="relative flex-1 max-w-sm">
          <SearchLg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search conversations..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <Button variant="outline" size="sm" className="shrink-0">
          <FilterLines className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead
              className="cursor-pointer select-none hover:text-foreground transition-colors"
              onClick={() => handleSort("agentName")}
            >
              <div className="flex items-center">
                Agent / Lead
                <SortIcon column="agentName" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hover:text-foreground transition-colors"
              onClick={() => handleSort("messageCount")}
            >
              <div className="flex items-center">
                Messages
                <SortIcon column="messageCount" />
              </div>
            </TableHead>
            <TableHead>Duration</TableHead>
            <TableHead
              className="cursor-pointer select-none min-w-[180px] hover:text-foreground transition-colors"
              onClick={() => handleSort("percentageOfTotal")}
            >
              <div className="flex items-center">
                % of Total
                <SortIcon column="percentageOfTotal" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hover:text-foreground transition-colors"
              onClick={() => handleSort("status")}
            >
              <div className="flex items-center">
                Status
                <SortIcon column="status" />
              </div>
            </TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                {debouncedSearch ? "No matching conversations found" : "No conversations found"}
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((row) => {
              const config = statusConfig[row.status];
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{row.agentName}</span>
                      {row.leadName && (
                        <span className="text-sm text-muted-foreground">{row.leadName}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{row.messageCount.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{row.duration}</TableCell>
                  <TableCell>
                    <Progress 
                      value={row.percentageOfTotal} 
                      showLabel 
                      labelPosition="right"
                      className="h-2 flex-1"
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant={config.variant} className={config.className}>
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => navigate(`/conversations?id=${row.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => navigate(`/conversations?id=${row.id}`)}
                      >
                        <MessageChatCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <DashboardPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="bg-muted/30"
        />
      )}
    </Card>
  );
}
