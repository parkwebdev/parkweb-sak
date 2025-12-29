import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { MessageTextSquare01 } from "@untitledui/icons";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTablePagination } from "@/components/data-table/DataTablePagination";
import { customerFeedbackColumns, CustomerFeedbackData } from "@/components/data-table/columns/customer-feedback-columns";
import { ChartCardHeader } from "./ChartCardHeader";
import type { FeedbackItem } from "@/types/analytics";

interface CustomerFeedbackCardProps {
  data: FeedbackItem[];
  loading?: boolean;
}

export const CustomerFeedbackCard = React.memo(function CustomerFeedbackCard({ data, loading }: CustomerFeedbackCardProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  // Transform all feedback data (no filter - show all ratings)
  const tableData = useMemo<CustomerFeedbackData[]>(() => {
    return data.map((item) => ({
      id: item.id,
      rating: item.rating,
      feedback: item.feedback,
      createdAt: item.createdAt,
      triggerType: item.triggerType,
      conversationId: item.conversationId,
    }));
  }, [data]);

  const table = useReactTable({
    data: tableData,
    columns: customerFeedbackColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  const isEmpty = !loading && tableData.length === 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <ChartCardHeader
          title="Customer Feedback"
          contextSummary="Recent feedback from customer ratings"
        />
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <MessageTextSquare01 size={24} className="text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-foreground">No feedback yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Feedback from customers will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <DataTable
              table={table}
              columns={customerFeedbackColumns}
              isLoading={loading}
              emptyMessage="No feedback found"
            />
            {tableData.length > 10 && <DataTablePagination table={table} />}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
