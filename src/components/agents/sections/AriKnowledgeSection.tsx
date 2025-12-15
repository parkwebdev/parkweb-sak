/**
 * AriKnowledgeSection
 * 
 * Knowledge sources management.
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Database01 } from '@untitledui/icons';
import { useKnowledgeSources } from '@/hooks/useKnowledgeSources';
import { useLocations } from '@/hooks/useLocations';
import { KnowledgeSourceCard } from '@/components/agents/KnowledgeSourceCard';
import { AddKnowledgeDialog } from '@/components/agents/AddKnowledgeDialog';
import { AriSectionHeader } from './AriSectionHeader';
import { LoadingState } from '@/components/ui/loading-state';
import { ZapSolidIcon } from '@/components/ui/zap-solid-icon';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/types/errors';

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

  // Filter out auto-created WordPress sources - they're managed in Locations tab
  const parentSources = getParentSources().filter(source => source.source_type !== 'wordpress_home');
  const outdatedCount = parentSources.filter(isSourceOutdated).length;

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
        {parentSources.length === 0 ? (
          <EmptyState
            icon={<Database01 className="h-5 w-5 text-muted-foreground/50" />}
            title="No knowledge sources yet"
            description="Add documents, URLs, or sitemaps to enhance Ari's knowledge"
            action={<Button onClick={() => setAddDialogOpen(true)} size="sm">Add Your First Source</Button>}
          />
        ) : (
          <div className="grid gap-3">
            {parentSources.map((source) => {
              const locationId = (source as any).default_location_id;
              const location = locationId ? locations.find(l => l.id === locationId) : null;
              
              return (
                <KnowledgeSourceCard
                  key={source.id}
                  source={source}
                  onDelete={deleteSource}
                  onReprocess={reprocessSource}
                  onResume={resumeProcessing}
                  onRetryChild={retryChildSource}
                  onDeleteChild={deleteChildSource}
                  onRefreshNow={triggerManualRefresh}
                  isOutdated={isSourceOutdated(source)}
                  childSources={getChildSources(source.id)}
                  locationName={location?.name}
                />
              );
            })}
          </div>
        )}

        <AddKnowledgeDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          agentId={agentId}
          userId={userId}
        />
      </div>
    </div>
  );
};
