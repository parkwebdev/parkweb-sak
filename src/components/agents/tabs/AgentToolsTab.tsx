import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Trash01, ChevronDown, XClose } from '@untitledui/icons';
import { CopyButton } from '@/components/ui/copy-button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type AgentTool = Tables<'agent_tools'>;

interface AgentToolsTabProps {
  agentId: string;
  agent?: Tables<'agents'>;
  onUpdate?: (id: string, updates: any) => Promise<any>;
}

export const AgentToolsTab = ({ agentId, agent, onUpdate }: AgentToolsTabProps) => {
  const [tools, setTools] = useState<AgentTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTool, setNewTool] = useState({
    name: '',
    description: '',
    parameters: '{}',
  });

  const apiEndpoint = `https://mvaimvwdukpgvkifkfpa.supabase.co/functions/v1/widget-chat`;
  const deploymentConfig = (agent?.deployment_config as any) || {};

  useEffect(() => {
    fetchTools();
  }, [agentId]);

  useEffect(() => {
    // Enable API by default
    if (agent && onUpdate) {
      if (!deploymentConfig.api_enabled) {
        onUpdate(agent.id, {
          deployment_config: {
            ...deploymentConfig,
            api_enabled: true,
          },
        });
      }
    }
  }, []);

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
      console.error('Error fetching tools:', error);
      toast.error('Failed to load tools');
    } finally {
      setLoading(false);
    }
  };

  const addTool = async () => {
    try {
      const parameters = JSON.parse(newTool.parameters);
      const { data, error } = await supabase
        .from('agent_tools')
        .insert({
          agent_id: agentId,
          name: newTool.name,
          description: newTool.description,
          parameters,
        })
        .select()
        .single();

      if (error) throw error;
      
      setTools([data, ...tools]);
      setNewTool({ name: '', description: '', parameters: '{}' });
      setShowAddForm(false);
      toast.success('Tool added successfully');
    } catch (error) {
      console.error('Error adding tool:', error);
      toast.error('Failed to add tool. Check JSON format.');
    }
  };

  const toggleTool = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('agent_tools')
        .update({ enabled })
        .eq('id', id);

      if (error) throw error;
      
      setTools(tools.map(t => t.id === id ? { ...t, enabled } : t));
      toast.success(`Tool ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating tool:', error);
      toast.error('Failed to update tool');
    }
  };

  const deleteTool = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agent_tools')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTools(tools.filter(t => t.id !== id));
      toast.success('Tool deleted');
    } catch (error) {
      console.error('Error deleting tool:', error);
      toast.error('Failed to delete tool');
    }
  };

  const getAgentApiUrl = () => {
    return `${apiEndpoint}?agent_id=${agentId}`;
  };

  const handleToggleApi = async (enabled: boolean) => {
    if (!agent || !onUpdate) return;
    
    await onUpdate(agent.id, {
      deployment_config: {
        ...deploymentConfig,
        api_enabled: enabled,
      },
    });
    toast.success(`API ${enabled ? 'enabled' : 'disabled'}`);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading tools...</div>;
  }

  return (
    <div className="max-w-5xl space-y-4 min-h-full pb-8">
      {/* API Access - Inline Banner */}
      {agent && onUpdate && (
        <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">API Access</h3>
              <p className="text-xs text-muted-foreground">Enable API access to interact programmatically</p>
            </div>
            <Switch
              id="api-enabled"
              checked={deploymentConfig?.api_enabled || false}
              onCheckedChange={handleToggleApi}
            />
          </div>

          {deploymentConfig?.api_enabled && (
            <div className="flex items-center gap-2 p-3 bg-background rounded-md border">
              <code className="flex-1 text-xs font-mono break-all text-muted-foreground">
                {getAgentApiUrl()}
              </code>
              <CopyButton content={getAgentApiUrl()} showToast={true} toastMessage="API endpoint copied" />
            </div>
          )}
        </div>
      )}

      {/* Tools List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Tools</h3>
            <p className="text-sm text-muted-foreground">Add custom tools and functions for your agent</p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
            {showAddForm ? <XClose className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {showAddForm ? 'Cancel' : 'Add Tool'}
          </Button>
        </div>

        {showAddForm && (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label htmlFor="tool-name" className="text-sm">Tool Name</Label>
              <Input
                id="tool-name"
                value={newTool.name}
                onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                placeholder="weather_lookup"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tool-description" className="text-sm">Description</Label>
              <Textarea
                id="tool-description"
                value={newTool.description}
                onChange={(e) => setNewTool({ ...newTool, description: e.target.value })}
                placeholder="Fetches current weather data for a location"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tool-parameters" className="text-sm">Parameters (JSON)</Label>
              <Textarea
                id="tool-parameters"
                value={newTool.parameters}
                onChange={(e) => setNewTool({ ...newTool, parameters: e.target.value })}
                placeholder='{"location": "string", "units": "celsius|fahrenheit"}'
                rows={4}
                className="font-mono text-sm"
              />
            </div>

            <Button onClick={addTool} className="w-full" size="sm">
              Add Tool
            </Button>
          </div>
        )}

        {tools.length === 0 ? (
          <div className="text-center py-12 border rounded-lg border-dashed">
            <p className="text-sm text-muted-foreground">
              No tools configured yet. Add your first tool to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tools.map((tool) => (
              <div key={tool.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-mono font-semibold">{tool.name}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{tool.description}</p>
                    
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 text-xs px-2 -ml-2">
                          <ChevronDown className="h-3 w-3 mr-1" />
                          View Parameters
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2">
                        <pre className="text-xs bg-muted p-3 rounded overflow-auto border">
                          {JSON.stringify(tool.parameters, null, 2)}
                        </pre>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={tool.enabled ?? true}
                      onCheckedChange={(checked) => toggleTool(tool.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteTool(tool.id)}
                    >
                      <Trash01 className="h-4 w-4 text-destructive" />
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
