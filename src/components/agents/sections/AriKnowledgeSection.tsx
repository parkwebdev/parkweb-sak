/**
 * AriKnowledgeSection
 * 
 * Knowledge sources management with TanStack Table and click-to-open details sheet.
 */

import { useState, useMemo, useCallback } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  getFilteredRowModel, 
  type SortingState, 
  type RowSelectionState 
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Database01, Trash01, XClose } from '@untitledui/icons';
import { useKnowledgeSources } from '@/hooks/useKnowledgeSources';
import { useLocations } from '@/hooks/useLocations';
import { AddKnowledgeDialog } from '@/components/agents/AddKnowledgeDialog';
import { KnowledgeDetailsSheet } from '@/components/agents/knowledge';
import { AriSectionHeader } from './AriSectionHeader';
import { LoadingState } from '@/components/ui/loading-state';
import { ZapSolidIcon } from '@/components/ui/zap-solid-icon';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';
import { DataTable } from '@/components/data-table/DataTable';
import { DataTableToolbar } from '@/components/data-table/DataTableToolbar';
import { createKnowledgeColumns, type KnowledgeSourceWithMeta } from '@/components/data-table/columns';
import { SimpleDeleteDialog } from '@/components/ui/simple-delete-dialog';
import type { KnowledgeSourceMetadata } from '@/types/metadata';

interface AriKnowledgeSectionProps {
  agentId: string;
  userId: string;
}

export const AriKnowledgeSection: React.FC<AriKnowledgeSectionProps> = ({ agentId, userId }) => {
  const { 
    sources, 
    loading, 
    deleteSource, 
    deleteChildSource, 
    reprocessSource, 
    resumeProcessing, 
    retryChildSource, 
    retrainAllSources, 
    triggerManualRefresh, 
    isSourceOutdated, 
    getChildSources, 
    getParentSources 
  } = useKnowledgeSources(agentId);
  
  const { locations } = useLocations(agentId);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainProgress, setRetrainProgress] = useState({ completed: 0, total: 0 });
  
  // Sheet state
  const [selectedSource, setSelectedSource] = useState<KnowledgeSourceWithMeta | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Delete confirmation state
  const [deleteSource_, setDeleteSource] = useState<KnowledgeSourceWithMeta | null>(null);
  
  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Filter out auto-created WordPress sources - they're managed in Locations tab
  const parentSources = getParentSources().filter(source => source.source_type !== 'wordpress_home');
  const outdatedCount = parentSources.filter(isSourceOutdated).length;

  // Transform parent sources to KnowledgeSourceWithMeta with computed fields
  const sourcesWithMeta: KnowledgeSourceWithMeta[] = useMemo(() => {
    return parentSources.map(source => {
      const metadata = (source.metadata || {}) as KnowledgeSourceMetadata;
      const childSources = getChildSources(source.id);
      const locationId = source.default_location_id;
      const location = locationId ? locations.find(l => l.id === locationId) : null;
      
      return {
        ...source,
        childCount: childSources.length,
        chunkCount: metadata.chunks_count ?? 0,
        locationName: location?.name,
      };
    });
  }, [parentSources, getChildSources, locations]);

  // Handler to view source details
  const handleViewSource = useCallback((source: KnowledgeSourceWithMeta) => {
    setSelectedSource(source);
    setSheetOpen(true);
  }, []);

  // Handler for delete button in table
  const handleSetDeleteSource = useCallback((source: KnowledgeSourceWithMeta) => {
    setDeleteSource(source);
  }, []);

  // Handler for reprocess in table
  const handleReprocessSource = useCallback(async (source: KnowledgeSourceWithMeta) => {
    await reprocessSource(source.id);
  }, [reprocessSource]);

  // Check if source is outdated
  const checkIsOutdated = useCallback((source: KnowledgeSourceWithMeta) => {
    return isSourceOutdated(source);
  }, [isSourceOutdated]);

  // Create table columns
  const columns = useMemo(() => createKnowledgeColumns({
    onView: handleViewSource,
    onDelete: handleSetDeleteSource,
    onReprocess: handleReprocessSource,
    isOutdated: checkIsOutdated,
  }), [handleViewSource, handleSetDeleteSource, handleReprocessSource, checkIsOutdated]);

  // Create table instance
  const table = useReactTable({
    data: sourcesWithMeta,
    columns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
  });

  const selectedCount = Object.keys(rowSelection).length;

  const handleRetrainAll = async () => {
    setIsRetraining(true);
    setRetrainProgress({ completed: 0, total: sources.filter(s => s.status !== 'processing').length });
    
    try {
      const { success, failed } = await retrainAllSources((completed, total) => {
        setRetrainProgress({ completed, total });
      });

      if (failed === 0) {
        toast.success('Retraining complete', {
          description: `Successfully retrained ${success} knowledge sources.`,
        });
      } else {
        toast.warning('Retraining completed with errors', {
          description: `${success} succeeded, ${failed} failed.`,
        });
      }
    } catch (error: unknown) {
      toast.error('Retraining failed', { description: getErrorMessage(error) });
    } finally {
      setIsRetraining(false);
      setRetrainProgress({ completed: 0, total: 0 });
    }
  };

  // Handle row click to open details sheet
  const handleRowClick = (source: KnowledgeSourceWithMeta) => {
    setSelectedSource(source);
    setSheetOpen(true);
  };

  // Handle delete from sheet
  const handleDeleteFromSheet = async (id: string) => {
    await deleteSource(id);
    setSheetOpen(false);
    setSelectedSource(null);
  };

  // Handle reprocess from sheet
  const handleReprocessFromSheet = async (id: string) => {
    await reprocessSource(id);
  };

  // Handle refresh from sheet
  const handleRefreshFromSheet = async (id: string) => {
    await triggerManualRefresh(id);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteSource_) return;
    await deleteSource(deleteSource_.id);
    setDeleteSource(null);
    // Clear selection if deleted source was selected
    if (selectedSource?.id === deleteSource_.id) {
      setSheetOpen(false);
      setSelectedSource(null);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) return;
    
    const count = selectedRows.length;
    const promises = selectedRows.map(row => deleteSource(row.original.id));
    
    await Promise.all(promises);
    setRowSelection({});
    toast.success(`Deleted ${count} source${count > 1 ? 's' : ''}`);
  };

  // Clear selection
  const clearSelection = () => {
    setRowSelection({});
  };

  if (loading) {
    return <LoadingState text="Loading knowledge sources..." />;
  }

  return (
    <div>
      <AriSectionHeader
        title="Knowledge"
        description="Add URLs, sitemaps, or documents to train Ari"
        extra={
          <div className="flex items-center gap-2">
            {sources.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetrainAll}
                disabled={isRetraining || sources.every(s => s.status === 'processing')}
              >
                <ZapSolidIcon size={16} className={`mr-1.5 text-orange-500 ${isRetraining ? 'animate-pulse' : ''}`} />
                {isRetraining 
                  ? `${retrainProgress.completed}/${retrainProgress.total}`
                  : outdatedCount > 0 
                    ? `Retrain (${outdatedCount})`
                    : 'Retrain'
                }
              </Button>
            )}
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              Add Source
            </Button>
          </div>
        }
      />

      <div className="space-y-4">
        {sourcesWithMeta.length === 0 ? (
          <EmptyState
            icon={<Database01 className="h-5 w-5 text-muted-foreground/50" />}
            title="No knowledge sources yet"
            description="Add documents, URLs, or sitemaps to enhance Ari's knowledge"
            action={<Button onClick={() => setAddDialogOpen(true)} size="sm">Add Your First Source</Button>}
          />
        ) : (
          <>
            {/* Bulk selection action bar */}
            {selectedCount > 0 && (
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
                <span className="text-sm text-muted-foreground">
                  {selectedCount} source{selectedCount > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="h-8 gap-1.5"
                  >
                    <XClose className="h-4 w-4" />
                    Clear
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="h-8 gap-1.5"
                  >
                    <Trash01 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            )}

            {/* DataTable with toolbar */}
            <DataTableToolbar
              table={table}
              searchPlaceholder="Search sources..."
              globalFilter
            />
            
            <DataTable
              table={table}
              columns={columns}
              onRowClick={handleRowClick}
              emptyMessage="No knowledge sources found."
            />
          </>
        )}

        <AddKnowledgeDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          agentId={agentId}
          userId={userId}
        />

        {/* Knowledge Details Sheet */}
        <KnowledgeDetailsSheet
          source={selectedSource}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onDelete={handleDeleteFromSheet}
          onReprocess={handleReprocessFromSheet}
          onRefreshNow={handleRefreshFromSheet}
          onRetryChild={retryChildSource}
          onDeleteChild={deleteChildSource}
          isOutdated={selectedSource ? isSourceOutdated(selectedSource) : false}
          childSources={selectedSource ? getChildSources(selectedSource.id) : []}
          locationName={selectedSource?.locationName}
        />

        {/* Delete confirmation dialog */}
        <SimpleDeleteDialog
          open={!!deleteSource_}
          onOpenChange={(open) => !open && setDeleteSource(null)}
          title="Delete Knowledge Source"
          description="Are you sure you want to delete this knowledge source? This action cannot be undone."
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </div>
  );
};
