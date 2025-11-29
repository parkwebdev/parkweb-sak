import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash01, File02 } from '@untitledui/icons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type KnowledgeSource = Tables<'knowledge_sources'>;

interface AgentKnowledgeTabProps {
  agentId: string;
  orgId: string;
}

const KNOWLEDGE_TYPES = [
  { value: 'url', label: 'URL / Website' },
  { value: 'pdf', label: 'PDF Document' },
  { value: 'json', label: 'JSON Data' },
  { value: 'csv', label: 'CSV Data' },
  { value: 'xml', label: 'XML Data' },
  { value: 'api', label: 'API Endpoint' },
];

export const AgentKnowledgeTab = ({ agentId, orgId }: AgentKnowledgeTabProps) => {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSource, setNewSource] = useState({
    type: 'url' as any,
    source: '',
  });

  useEffect(() => {
    fetchSources();
  }, [agentId]);

  const fetchSources = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_sources')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSources(data || []);
    } catch (error) {
      console.error('Error fetching knowledge sources:', error);
      toast.error('Failed to load knowledge sources');
    } finally {
      setLoading(false);
    }
  };

  const addSource = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_sources')
        .insert({
          agent_id: agentId,
          org_id: orgId,
          type: newSource.type,
          source: newSource.source,
          status: 'processing',
        })
        .select()
        .single();

      if (error) throw error;
      
      setSources([data, ...sources]);
      setNewSource({ type: 'url', source: '' });
      setShowAddForm(false);
      toast.success('Knowledge source added');
    } catch (error) {
      console.error('Error adding knowledge source:', error);
      toast.error('Failed to add knowledge source');
    }
  };

  const deleteSource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('knowledge_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSources(sources.filter(s => s.id !== id));
      toast.success('Knowledge source deleted');
    } catch (error) {
      console.error('Error deleting knowledge source:', error);
      toast.error('Failed to delete knowledge source');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-info/10 text-info border-info/20';
      case 'ready':
        return 'bg-success/10 text-success border-success/20';
      case 'error':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading knowledge sources...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Add knowledge sources to give your agent access to specific information.
        </p>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Source
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Knowledge Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source-type">Source Type</Label>
              <Select value={newSource.type} onValueChange={(value: any) => setNewSource({ ...newSource, type: value })}>
                <SelectTrigger id="source-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KNOWLEDGE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source-url">Source URL / Path</Label>
              <Input
                id="source-url"
                value={newSource.source}
                onChange={(e) => setNewSource({ ...newSource, source: e.target.value })}
                placeholder="https://example.com/docs or /path/to/file"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={addSource} disabled={!newSource.source}>
                Add Source
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {sources.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No knowledge sources configured yet. Add sources to enhance agent responses.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sources.map((source) => (
            <Card key={source.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <File02 className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {source.type}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(source.status)}>
                          {source.status}
                        </Badge>
                      </div>
                      <p className="text-sm break-all">{source.source}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Added {new Date(source.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSource(source.id)}
                  >
                    <Trash01 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
