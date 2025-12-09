import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '../DataTableColumnHeader';

// Type definitions for analytics data
export interface ConversationAnalyticsRow {
  created_at: string;
  agent_name: string;
  status: string;
  message_count: number;
  duration: string;
}

export interface LeadAnalyticsRow {
  created_at: string;
  name: string;
  email: string;
  company: string;
  status: string;
}

export interface AgentPerformanceRow {
  agent_name: string;
  total_conversations: number;
  avg_response_time: number;
  satisfaction_score: number | null;
}

export interface UsageMetricsRow {
  date: string;
  conversations: number;
  messages: number;
  api_calls: number;
}

// Conversations Analytics Columns
export const conversationsAnalyticsColumns: ColumnDef<ConversationAnalyticsRow>[] = [
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string;
      return format(new Date(date), 'MMM d, yyyy');
    },
  },
  {
    accessorKey: 'agent_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Agent" />
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variant = status === 'active' ? 'default' : status === 'closed' ? 'secondary' : 'outline';
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: 'message_count',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Messages" />
    ),
  },
  {
    accessorKey: 'duration',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Duration" />
    ),
  },
];

// Leads Analytics Columns
export const leadsAnalyticsColumns: ColumnDef<LeadAnalyticsRow>[] = [
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string;
      return format(new Date(date), 'MMM d, yyyy');
    },
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: 'company',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company" />
    ),
    cell: ({ row }) => row.getValue('company') || '-',
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variant = status === 'converted' ? 'default' : status === 'qualified' ? 'secondary' : 'outline';
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
];

// Agent Performance Columns
export const agentPerformanceColumns: ColumnDef<AgentPerformanceRow>[] = [
  {
    accessorKey: 'agent_name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Agent" />
    ),
  },
  {
    accessorKey: 'total_conversations',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Conversations" />
    ),
  },
  {
    accessorKey: 'avg_response_time',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Avg Response Time" />
    ),
    cell: ({ row }) => {
      const time = row.getValue('avg_response_time') as number;
      return `${time.toFixed(1)}s`;
    },
  },
  {
    accessorKey: 'satisfaction_score',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Satisfaction" />
    ),
    cell: ({ row }) => {
      const score = row.getValue('satisfaction_score') as number | null;
      return score !== null ? score.toFixed(1) : '-';
    },
  },
];

// Usage Metrics Columns
export const usageMetricsColumns: ColumnDef<UsageMetricsRow>[] = [
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
  },
  {
    accessorKey: 'conversations',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Conversations" />
    ),
  },
  {
    accessorKey: 'messages',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Messages" />
    ),
  },
  {
    accessorKey: 'api_calls',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="API Calls" />
    ),
  },
];
