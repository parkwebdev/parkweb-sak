/**
 * CreateToolDialog Component
 * 
 * Dialog for creating custom tools that agents can invoke.
 * Configures endpoint URL, parameters (JSON Schema), headers, and timeout.
 * @module components/agents/CreateToolDialog
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormHint } from '@/components/ui/form-hint';
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

interface CreateToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTool: (tool: {
    name: string;
    description: string;
    endpoint_url: string;
    parameters: string;
    headers: string;
    timeout_ms: number;
  }) => Promise<void>;
}

export const CreateToolDialog = ({ open, onOpenChange, onCreateTool }: CreateToolDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [tool, setTool] = useState({
    name: '',
    description: '',
    endpoint_url: '',
    parameters: '{\n  "type": "object",\n  "properties": {},\n  "required": []\n}',
    headers: '{}',
    timeout_ms: 10000,
  });

  const resetForm = () => {
    setTool({
      name: '',
      description: '',
      endpoint_url: '',
      parameters: '{\n  "type": "object",\n  "properties": {},\n  "required": []\n}',
      headers: '{}',
      timeout_ms: 10000,
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onCreateTool(tool);
      resetForm();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const isValid = tool.name && tool.endpoint_url && tool.description;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Custom Tool</DialogTitle>
          <DialogDescription>
            Define a tool that your agent can call to fetch data or perform actions.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tool-name" className="text-sm">Tool Name *</Label>
            <Input
              id="tool-name"
              value={tool.name}
              onChange={(e) => setTool({ ...tool, name: e.target.value })}
              placeholder="weather_lookup"
              aria-describedby="tool-name-hint"
            />
            <FormHint id="tool-name-hint">Use snake_case, e.g. check_inventory</FormHint>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tool-endpoint" className="text-sm">Endpoint URL *</Label>
            <Input
              id="tool-endpoint"
              value={tool.endpoint_url}
              onChange={(e) => setTool({ ...tool, endpoint_url: e.target.value })}
              placeholder="https://api.example.com/weather"
              aria-describedby="tool-endpoint-hint"
            />
            <FormHint id="tool-endpoint-hint">Receives POST with tool arguments as JSON body</FormHint>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tool-description" className="text-sm">Description *</Label>
            <Textarea
              id="tool-description"
              value={tool.description}
              onChange={(e) => setTool({ ...tool, description: e.target.value })}
              placeholder="Fetches current weather data for a given location. Returns temperature, conditions, and humidity."
              rows={2}
              aria-describedby="tool-description-hint"
            />
            <FormHint id="tool-description-hint">Help the AI understand when to use this tool</FormHint>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tool-parameters" className="text-sm">Parameters (JSON Schema)</Label>
            <Textarea
              id="tool-parameters"
              value={tool.parameters}
              onChange={(e) => setTool({ ...tool, parameters: e.target.value })}
              placeholder='{"type": "object", "properties": {...}}'
              rows={5}
              className="font-mono text-xs"
              aria-describedby="tool-parameters-hint"
            />
            <FormHint id="tool-parameters-hint">Define the arguments using JSON Schema format</FormHint>
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
                <Label htmlFor="tool-headers" className="text-sm">Headers (JSON)</Label>
                <Textarea
                  id="tool-headers"
                  value={tool.headers}
                  onChange={(e) => setTool({ ...tool, headers: e.target.value })}
                  placeholder='{"Authorization": "Bearer your_api_key"}'
                  rows={2}
                  className="font-mono text-xs"
                  aria-describedby="tool-headers-hint"
                />
                <FormHint id="tool-headers-hint">Optional custom headers for authentication</FormHint>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tool-timeout" className="text-sm">Timeout (ms)</Label>
                <Input
                  id="tool-timeout"
                  type="number"
                  value={tool.timeout_ms}
                  onChange={(e) => setTool({ ...tool, timeout_ms: parseInt(e.target.value) || 10000 })}
                  min={1000}
                  max={30000}
                  aria-describedby="tool-timeout-hint"
                />
                <FormHint id="tool-timeout-hint">Request timeout (1-30 seconds)</FormHint>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || loading} loading={loading}>
            Create Tool
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
