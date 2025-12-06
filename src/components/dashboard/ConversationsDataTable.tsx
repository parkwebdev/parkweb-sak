import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  SearchLg,
  FilterLines,
  Eye,
  MessageChatCircle,
  ArrowUp,
  ArrowDown,
} from "@untitledui/icons";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
}

type SortColumn = "agentName" | "messageCount" | "duration" | "percentageOfTotal" | "status";
type SortDirection = "asc" | "desc";

const statusConfig = {
  active: { label: "Active", variant: "default" as const, className: "bg-success/10 text-success border-success/20" },
  human_takeover: { label: "Human", variant: "default" as const, className: "bg-info/10 text-info border-info/20" },
  closed: { label: "Closed", variant: "secondary" as const, className: "bg-muted text-muted-foreground" },
};

export function ConversationsDataTable({
  data,
  title = "Conversations",
  className,
}: ConversationsDataTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("messageCount");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      const searchLower = search.toLowerCase();
      return (
        row.agentName.toLowerCase().includes(searchLower) ||
        (row.leadName?.toLowerCase().includes(searchLower) ?? false)
      );
    });
  }, [data, search]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
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
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, page]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>

      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="relative flex-1 max-w-sm">
          <SearchLg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm">
          <FilterLines className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("agentName")}
            >
              <div className="flex items-center">
                Agent / Lead
                <SortIcon column="agentName" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("messageCount")}
            >
              <div className="flex items-center">
                Messages
                <SortIcon column="messageCount" />
              </div>
            </TableHead>
            <TableHead>Duration</TableHead>
            <TableHead
              className="cursor-pointer select-none min-w-[180px]"
              onClick={() => handleSort("percentageOfTotal")}
            >
              <div className="flex items-center">
                % of Total
                <SortIcon column="percentageOfTotal" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
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
                No conversations found
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
                    <div className="flex items-center gap-3">
                      <Progress value={row.percentageOfTotal} className="h-2 flex-1" />
                      <span className="w-12 text-sm text-muted-foreground">
                        {row.percentageOfTotal.toFixed(1)}%
                      </span>
                    </div>
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
