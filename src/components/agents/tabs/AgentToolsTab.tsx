import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash01 } from '@untitledui/icons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type AgentTool = Tables<'agent_tools'>;

interface AgentToolsTabProps {
  agentId: string;
}

export const AgentToolsTab = ({ agentId }: AgentToolsTabProps) => {
  const [tools, setTools] = useState<AgentTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTool, setNewTool] = useState({
    name: '',
    description: '',
    parameters: '{}',
  });

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

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading tools...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Tools allow your agent to perform actions and access external services.
        </p>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tool
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Tool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tool-name">Tool Name</Label>
              <Input
                id="tool-name"
                value={newTool.name}
                onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                placeholder="get_weather"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tool-description">Description</Label>
              <Textarea
                id="tool-description"
                value={newTool.description}
                onChange={(e) => setNewTool({ ...newTool, description: e.target.value })}
                placeholder="Gets the current weather for a location"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tool-parameters">Parameters (JSON)</Label>
              <Textarea
                id="tool-parameters"
                value={newTool.parameters}
                onChange={(e) => setNewTool({ ...newTool, parameters: e.target.value })}
                placeholder='{"type": "object", "properties": {"location": {"type": "string"}}}'
                rows={4}
                className="font-mono text-xs"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={addTool} disabled={!newTool.name || !newTool.description}>
                Add Tool
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tools.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No tools configured yet. Add your first tool to extend agent capabilities.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tools.map((tool) => (
            <Card key={tool.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{tool.name}</CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={tool.enabled ?? true}
                      onCheckedChange={(checked) => toggleTool(tool.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTool(tool.id)}
                    >
                      <Trash01 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground mb-2">
                    View Parameters
                  </summary>
                  <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs">
                    {JSON.stringify(tool.parameters, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
