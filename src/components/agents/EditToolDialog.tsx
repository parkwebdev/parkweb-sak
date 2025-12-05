import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from '@untitledui/icons';
import type { Tables } from '@/integrations/supabase/types';

type AgentTool = Tables<'agent_tools'>;

interface EditToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: AgentTool | null;
  onSave: (toolId: string, updates: {
    name: string;
    description: string;
    endpoint_url: string;
    parameters: string;
    headers: string;
    timeout_ms: number;
  }) => Promise<void>;
}

export const EditToolDialog = ({ open, onOpenChange, tool, onSave }: EditToolDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    endpoint_url: '',
    parameters: '{}',
    headers: '{}',
    timeout_ms: 10000,
  });

  useEffect(() => {
    if (tool) {
      setFormData({
        name: tool.name,
        description: tool.description,
        endpoint_url: tool.endpoint_url || '',
        parameters: JSON.stringify(tool.parameters, null, 2),
        headers: JSON.stringify(tool.headers || {}, null, 2),
        timeout_ms: tool.timeout_ms || 10000,
      });
    }
  }, [tool]);

  const handleSubmit = async () => {
    if (!tool) return;
    setLoading(true);
    try {
      await onSave(tool.id, formData);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const isValid = formData.name && formData.endpoint_url && formData.description;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Tool</DialogTitle>
          <DialogDescription>
            Modify the tool configuration. Changes will take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-tool-name" className="text-sm">Tool Name *</Label>
            <Input
              id="edit-tool-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="weather_lookup"
            />
            <p className="text-[10px] text-muted-foreground">Use snake_case, e.g. check_inventory</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tool-endpoint" className="text-sm">Endpoint URL *</Label>
            <Input
              id="edit-tool-endpoint"
              value={formData.endpoint_url}
              onChange={(e) => setFormData({ ...formData, endpoint_url: e.target.value })}
              placeholder="https://api.example.com/weather"
            />
            <p className="text-[10px] text-muted-foreground">Receives POST with tool arguments as JSON body</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tool-description" className="text-sm">Description *</Label>
            <Textarea
              id="edit-tool-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Fetches current weather data for a given location."
              rows={2}
            />
            <p className="text-[10px] text-muted-foreground">Help the AI understand when to use this tool</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tool-parameters" className="text-sm">Parameters (JSON Schema)</Label>
            <Textarea
              id="edit-tool-parameters"
              value={formData.parameters}
              onChange={(e) => setFormData({ ...formData, parameters: e.target.value })}
              placeholder='{"type": "object", "properties": {...}}'
              rows={5}
              className="font-mono text-xs"
            />
            <p className="text-[10px] text-muted-foreground">Define the arguments using JSON Schema format</p>
          </div>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs px-0 hover:bg-transparent">
                <ChevronDown className="h-3 w-3 mr-1" />
                Advanced Settings
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-3">
              <div className="space-y-2">
                <Label htmlFor="edit-tool-headers" className="text-sm">Headers (JSON)</Label>
                <Textarea
                  id="edit-tool-headers"
                  value={formData.headers}
                  onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
                  placeholder='{"Authorization": "Bearer your_api_key"}'
                  rows={2}
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground">Optional custom headers for authentication</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-tool-timeout" className="text-sm">Timeout (ms)</Label>
                <Input
                  id="edit-tool-timeout"
                  type="number"
                  value={formData.timeout_ms}
                  onChange={(e) => setFormData({ ...formData, timeout_ms: parseInt(e.target.value) || 10000 })}
                  min={1000}
                  max={30000}
                />
                <p className="text-[10px] text-muted-foreground">Request timeout (1-30 seconds)</p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || loading} loading={loading}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};