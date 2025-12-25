import { format } from 'date-fns';
import type { Tables, Enums } from '@/integrations/supabase/types';

type Lead = Tables<'leads'>;

// Extended lead type with conversation metadata for export
export interface LeadWithMetadata extends Lead {
  conversationMetadata?: {
    priority?: string;
    tags?: string[];
    notes?: string;
  };
}

export type ExportColumn = 
  | 'name'
  | 'email'
  | 'phone'
  | 'company'
  | 'status'
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'has_conversation'
  | 'custom_data'
  | 'priority'
  | 'tags'
  | 'notes';

export interface ExportOptions {
  columns: ExportColumn[];
  statuses: Enums<'lead_status'>[];
  dateRange: 'all' | '7days' | '30days' | '90days' | 'custom';
  customDateStart?: Date;
  customDateEnd?: Date;
  includeHeaders: boolean;
  useCurrentView: boolean;
}

export const COLUMN_LABELS: Record<ExportColumn, string> = {
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  company: 'Company',
  status: 'Status',
  id: 'Lead ID',
  created_at: 'Created Date',
  updated_at: 'Updated Date',
  has_conversation: 'Has Conversation',
  custom_data: 'Custom Data',
  priority: 'Priority',
  tags: 'Tags',
  notes: 'Internal Notes',
};

export const DEFAULT_COLUMNS: ExportColumn[] = ['name', 'email', 'phone', 'company', 'status'];

export const ALL_COLUMNS: ExportColumn[] = [
  'name',
  'email',
  'phone',
  'company',
  'status',
  'priority',
  'tags',
  'notes',
  'id',
  'created_at',
  'updated_at',
  'has_conversation',
  'custom_data',
];

// Columns that require conversation metadata
export const CONVERSATION_COLUMNS: ExportColumn[] = ['priority', 'tags', 'notes'];

export const STATUS_OPTIONS: { value: Enums<'lead_status'>; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
];

function formatDate(date: string | null): string {
  if (!date) return '';
  const d = new Date(date);
  return format(d, 'MM/dd/yyyy');
}

function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function getColumnValue(lead: LeadWithMetadata, column: ExportColumn): string {
  switch (column) {
    case 'name':
      return lead.name || '';
    case 'email':
      return lead.email || '';
    case 'phone':
      return lead.phone || '';
    case 'company':
      return lead.company || '';
    case 'status':
      return lead.status;
    case 'id':
      return lead.id;
    case 'created_at':
      return formatDate(lead.created_at);
    case 'updated_at':
      return formatDate(lead.updated_at);
    case 'has_conversation':
      return lead.conversation_id ? 'Yes' : 'No';
    case 'custom_data':
      return lead.data ? JSON.stringify(lead.data) : '';
    case 'priority':
      return lead.conversationMetadata?.priority || '';
    case 'tags':
      return lead.conversationMetadata?.tags?.join('; ') || '';
    case 'notes':
      return lead.conversationMetadata?.notes || '';
    default:
      return '';
  }
}

export function filterLeads<T extends Lead>(leads: T[], options: ExportOptions): T[] {
  let filtered = [...leads];

  // Filter by status
  if (options.statuses.length > 0 && options.statuses.length < STATUS_OPTIONS.length) {
    filtered = filtered.filter(lead => options.statuses.includes(lead.status));
  }

  // Filter by date range
  if (options.dateRange !== 'all') {
    const now = new Date();
    let startDate: Date;

    switch (options.dateRange) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (options.customDateStart) {
          startDate = options.customDateStart;
        } else {
          startDate = new Date(0);
        }
        break;
      default:
        startDate = new Date(0);
    }

    filtered = filtered.filter(lead => {
      const createdAt = new Date(lead.created_at);
      if (createdAt < startDate) return false;
      if (options.dateRange === 'custom' && options.customDateEnd) {
        const endDate = new Date(options.customDateEnd);
        endDate.setHours(23, 59, 59, 999);
        if (createdAt > endDate) return false;
      }
      return true;
    });
  }

  return filtered;
}

export function generateCSV(leads: LeadWithMetadata[], options: ExportOptions): string {
  const rows: string[] = [];

  // Add headers
  if (options.includeHeaders) {
    const headers = options.columns.map(col => escapeCSVValue(COLUMN_LABELS[col]));
    rows.push(headers.join(','));
  }

  // Add data rows
  for (const lead of leads) {
    const values = options.columns.map(col => 
      escapeCSVValue(getColumnValue(lead, col))
    );
    rows.push(values.join(','));
  }

  return rows.join('\n');
}

export function downloadCSV(csv: string, filename: string): void {
  // Add UTF-8 BOM for Excel compatibility
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportLeads(
  allLeads: LeadWithMetadata[],
  filteredLeads: LeadWithMetadata[],
  options: ExportOptions
): { count: number; success: boolean } {
  try {
    // Determine which leads to export
    const sourceLeads = options.useCurrentView ? filteredLeads : allLeads;
    
    // Apply additional filters
    const leadsToExport = filterLeads(sourceLeads, options);
    
    if (leadsToExport.length === 0) {
      return { count: 0, success: false };
    }

    // Generate CSV
    const csv = generateCSV(leadsToExport, options);
    
    // Generate filename with timestamp
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
    const filename = `leads_export_${timestamp}.csv`;
    
    // Download
    downloadCSV(csv, filename);
    
    return { count: leadsToExport.length, success: true };
  } catch (error) {
    console.error('Export failed:', error);
    return { count: 0, success: false };
  }
}

// Check if any selected columns require conversation metadata
export function needsConversationMetadata(columns: ExportColumn[]): boolean {
  return columns.some(col => CONVERSATION_COLUMNS.includes(col));
}
