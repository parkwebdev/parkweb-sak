/**
 * AriCustomToolsSection
 * 
 * Custom tools management - simplified version.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash01, Link03, Edit03 } from '@untitledui/icons';
import { EmptyState } from '@/components/ui/empty-state';
import { AriSectionHeader } from './AriSectionHeader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/lib/toast';
import { logger } from '@/utils/logger';
import type { Tables } from '@/integrations/supabase/types';

type AgentTool = Tables<'agent_tools'>;

interface AriCustomToolsSectionProps {
  agentId: string;
}

export const AriCustomToolsSection: React.FC<AriCustomToolsSectionProps> = ({ agentId }) => {
  const [tools, setTools] = useState<AgentTool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTools();
  }, [agentId]);

  const fetchTools = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_tools')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTools(data || []);
    } catch (error) {
      logger.error('Error fetching tools:', error);
      toast.error('Failed to load tools');
    } finally {
      setLoading(false);
    }
  };

  const toggleTool = async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from('agent_tools')
      .update({ enabled })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update tool');
      return;
    }
    
    setTools(tools.map(t => t.id === id ? { ...t, enabled } : t));
  };

  const deleteTool = async (id: string) => {
    const { error } = await supabase
      .from('agent_tools')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete tool');
      return;
    }
    
    setTools(tools.filter(t => t.id !== id));
    toast.success('Tool deleted');
  };

  return (
    <div>
      <AriSectionHeader
        title="Custom Tools"
        description="Add custom tools that extend Ari's capabilities"
      />

      <div className="space-y-4">
        {tools.length === 0 ? (
          <EmptyState
            icon={<Link03 className="h-5 w-5 text-muted-foreground/50" />}
            title="No tools configured yet"
            description="Tools let Ari call external APIs for real-time data"
          />
        ) : (
          <div className="space-y-2">
            {tools.map((tool) => (
              <div key={tool.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-mono font-semibold">{tool.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{tool.description}</p>
                    {tool.endpoint_url && (
                      <p className="text-xs font-mono text-muted-foreground/70 truncate">
                        {tool.endpoint_url}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={tool.enabled ?? true}
                      onCheckedChange={(checked) => toggleTool(tool.id, checked)}
                    />
                    <Button variant="ghost" size="sm" onClick={() => deleteTool(tool.id)}>
                      <Trash01 size={14} className="text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
