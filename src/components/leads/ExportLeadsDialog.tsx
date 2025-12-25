import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Download01, Calendar as CalendarIcon } from '@untitledui/icons';
import { toast } from 'sonner';
import type { Tables, Enums } from '@/integrations/supabase/types';
import {
  ExportColumn,
  ExportOptions,
  COLUMN_LABELS,
  DEFAULT_COLUMNS,
  ALL_COLUMNS,
  STATUS_OPTIONS,
  filterLeads,
  exportLeads,
} from '@/lib/leads-export';

type Lead = Tables<'leads'>;

interface ExportLeadsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allLeads: Lead[];
  filteredLeads: Lead[];
}

export function ExportLeadsDialog({
  open,
  onOpenChange,
  allLeads,
  filteredLeads,
}: ExportLeadsDialogProps) {
  // Column selection
  const [selectedColumns, setSelectedColumns] = useState<ExportColumn[]>(DEFAULT_COLUMNS);
  
  // Status filter
  const [selectedStatuses, setSelectedStatuses] = useState<Enums<'lead_status'>[]>(
    STATUS_OPTIONS.map(s => s.value)
  );
  
  // Date range
  const [dateRange, setDateRange] = useState<'all' | '7days' | '30days' | '90days' | 'custom'>('all');
  const [customDateStart, setCustomDateStart] = useState<Date | undefined>();
  const [customDateEnd, setCustomDateEnd] = useState<Date | undefined>();
  
  // Export settings
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [useCurrentView, setUseCurrentView] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedColumns(DEFAULT_COLUMNS);
      setSelectedStatuses(STATUS_OPTIONS.map(s => s.value));
      setDateRange('all');
      setCustomDateStart(undefined);
      setCustomDateEnd(undefined);
      setIncludeHeaders(true);
      setUseCurrentView(false);
    }
  }, [open]);

  // Calculate preview count
  const previewCount = useMemo(() => {
    const options: ExportOptions = {
      columns: selectedColumns,
      statuses: selectedStatuses,
      dateRange,
      customDateStart,
      customDateEnd,
      includeHeaders,
      useCurrentView,
    };
    
    const sourceLeads = useCurrentView ? filteredLeads : allLeads;
    return filterLeads(sourceLeads, options).length;
  }, [
    selectedColumns,
    selectedStatuses,
    dateRange,
    customDateStart,
    customDateEnd,
    useCurrentView,
    allLeads,
    filteredLeads,
  ]);
  const handleColumnToggle = useCallback((column: ExportColumn) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    );
  }, []);

  const handleSelectAllColumns = useCallback(() => {
    setSelectedColumns([...ALL_COLUMNS]);
  }, []);

  const handleDeselectAllColumns = useCallback(() => {
    setSelectedColumns([]);
  }, []);

  const handleStatusToggle = useCallback((status: Enums<'lead_status'>) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  }, []);

  const handleExport = useCallback(() => {
    if (selectedColumns.length === 0) {
      toast.error('Please select at least one column to export');
      return;
    }

    const options: ExportOptions = {
      columns: selectedColumns,
      statuses: selectedStatuses,
      dateRange,
      customDateStart,
      customDateEnd,
      includeHeaders,
      useCurrentView,
    };

    const result = exportLeads(allLeads, filteredLeads, options);

    if (result.success) {
      toast.success(`Successfully exported ${result.count} leads`);
      onOpenChange(false);
    } else {
      toast.error('No leads to export with the selected filters');
    }
  }, [selectedColumns, selectedStatuses, dateRange, customDateStart, customDateEnd, includeHeaders, useCurrentView, allLeads, filteredLeads, onOpenChange]);

  const canExport = selectedColumns.length > 0 && previewCount > 0;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Leads</DialogTitle>
          <DialogDescription>
            Choose what data to include in your export
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Columns Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Columns to export</Label>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllColumns}
                  className="h-7 px-2 text-xs"
                >
                  Select all
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAllColumns}
                  className="h-7 px-2 text-xs"
                >
                  Deselect all
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-3">
              {ALL_COLUMNS.map(column => (
                <div key={column} className="flex items-center gap-2">
                  <Checkbox
                    id={`col-${column}`}
                    checked={selectedColumns.includes(column)}
                    onCheckedChange={() => handleColumnToggle(column)}
                  />
                  <Label
                    htmlFor={`col-${column}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {COLUMN_LABELS[column]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Filter Section */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Filter leads</Label>
            
            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(status => (
                  <div
                    key={status.value}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors',
                      selectedStatuses.includes(status.value)
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                    )}
                    onClick={() => handleStatusToggle(status.value)}
                  >
                    <Checkbox
                      checked={selectedStatuses.includes(status.value)}
                      onCheckedChange={() => handleStatusToggle(status.value)}
                      className="h-3 w-3"
                    />
                    {status.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Date range</Label>
              <Select
                value={dateRange}
                onValueChange={(value: typeof dateRange) => setDateRange(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="7days">Last 7 days</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="90days">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>

              {dateRange === 'custom' && (
                <div className="flex gap-2 mt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          'flex-1 justify-start text-left font-normal',
                          !customDateStart && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateStart ? format(customDateStart, 'PP') : 'Start date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customDateStart}
                        onSelect={setCustomDateStart}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          'flex-1 justify-start text-left font-normal',
                          !customDateEnd && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateEnd ? format(customDateEnd, 'PP') : 'End date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customDateEnd}
                        onSelect={setCustomDateEnd}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* Current View Toggle */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div className="space-y-0.5">
                <Label className="text-sm">Export current view only</Label>
                <p className="text-xs text-muted-foreground">
                  Only export the {filteredLeads.length} leads in your current filtered view
                </p>
              </div>
              <Switch
                checked={useCurrentView}
                onCheckedChange={setUseCurrentView}
              />
            </div>
          </div>

          <Separator />

          {/* Export Settings */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Export settings</Label>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Include column headers</Label>
              <Switch
                checked={includeHeaders}
                onCheckedChange={setIncludeHeaders}
              />
            </div>
          </div>
        </div>

        {/* Preview Count */}
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <span className="text-sm text-muted-foreground">
            Exporting{' '}
            <span className="font-semibold text-foreground">{previewCount}</span>{' '}
            {previewCount === 1 ? 'lead' : 'leads'}
          </span>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleExport} disabled={!canExport}>
            <Download01 size={16} className="mr-2" />
            Export CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
