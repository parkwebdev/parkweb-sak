import React, { useMemo } from 'react';
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import { Download01 } from '@untitledui/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import {
  conversationsAnalyticsColumns,
  leadsAnalyticsColumns,
  agentPerformanceColumns,
  usageMetricsColumns,
  type ConversationAnalyticsRow,
  type LeadAnalyticsRow,
  type AgentPerformanceRow,
  type UsageMetricsRow,
} from '@/components/data-table/columns/analytics-columns';

interface DataTablesProps {
  activeTab: 'conversations' | 'leads' | 'agents' | 'usage';
  data: any;
}

type TableDataRow = ConversationAnalyticsRow | LeadAnalyticsRow | AgentPerformanceRow | UsageMetricsRow;

export const DataTables: React.FC<DataTablesProps> = ({ activeTab, data }) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const { columns, tableData, headers, title, description } = useMemo(() => {
    switch (activeTab) {
      case 'conversations':
        return {
          columns: conversationsAnalyticsColumns,
          tableData: (data?.conversations || []) as ConversationAnalyticsRow[],
          headers: ['Date', 'Agent', 'Status', 'Messages', 'Duration'],
          title: 'Conversation Details',
          description: 'Detailed breakdown of all conversations',
        };
      case 'leads':
        return {
          columns: leadsAnalyticsColumns,
          tableData: (data?.leads || []) as LeadAnalyticsRow[],
          headers: ['Date', 'Name', 'Email', 'Company', 'Status'],
          title: 'Lead Details',
          description: 'Complete list of captured leads',
        };
      case 'agents':
        return {
          columns: agentPerformanceColumns,
          tableData: (data?.agentPerformance || []) as AgentPerformanceRow[],
          headers: ['Agent', 'Conversations', 'Avg Response Time', 'Satisfaction'],
          title: 'Agent Performance',
          description: 'Performance metrics by agent',
        };
      case 'usage':
        return {
          columns: usageMetricsColumns,
          tableData: (data?.usageMetrics || []) as UsageMetricsRow[],
          headers: ['Date', 'Conversations', 'Messages', 'API Calls'],
          title: 'Usage Metrics',
          description: 'Daily usage statistics',
        };
      default:
        return {
          columns: [],
          tableData: [],
          headers: [],
          title: 'Data',
          description: '',
        };
    }
  }, [activeTab, data]);

  const table = useReactTable<TableDataRow>({
    data: tableData as TableDataRow[],
    columns: columns as ColumnDef<TableDataRow>[],
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const exportTableData = () => {
    if (!tableData.length) return;

    const csvContent = [
      headers.join(','),
      ...tableData.map((row: TableDataRow) =>
        headers.map((header) => {
          const key = header.toLowerCase().replace(/\s+/g, '_');
          const value = (row as any)[key] ?? '';
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-data.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={exportTableData} disabled={!tableData.length}>
          <Download01 className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <DataTable
          table={table}
          columns={columns as any}
          emptyMessage="No data available for this period."
        />
      </CardContent>
    </Card>
  );
};
