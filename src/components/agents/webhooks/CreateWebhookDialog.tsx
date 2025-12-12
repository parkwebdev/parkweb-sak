import { useState } from 'react';
import { logger } from '@/utils/logger';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useWebhooks } from '@/hooks/useWebhooks';
import { toast } from '@/lib/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConditionBuilder } from './ConditionBuilder';
import { ResponseActionBuilder, type ResponseAction } from './ResponseActionBuilder';

interface CreateWebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId?: string;
}

/** Condition rule for webhook triggers */
interface ConditionRule {
  field: string;
  operator: string;
  value: string;
}

/** Local state type for webhook conditions */
interface ConditionsState {
  rules: ConditionRule[];
  logic: string;
}

const AVAILABLE_EVENTS = [
  { value: 'lead.created', label: 'Lead Created' },
  { value: 'lead.updated', label: 'Lead Updated' },
  { value: 'conversation.started', label: 'Conversation Started' },
  { value: 'conversation.closed', label: 'Conversation Closed' },
  { value: 'message.received', label: 'Message Received' },
];

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const AUTH_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'api_key', label: 'API Key' },
  { value: 'bearer_token', label: 'Bearer Token' },
  { value: 'basic_auth', label: 'Basic Auth' },
];

export const CreateWebhookDialog = ({ open, onOpenChange, agentId }: CreateWebhookDialogProps) => {
  const { createWebhook } = useWebhooks(agentId);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('POST');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [authType, setAuthType] = useState('none');
  const [authConfig, setAuthConfig] = useState<Record<string, string>>({});
  const [customHeaders, setCustomHeaders] = useState<Array<{ key: string; value: string }>>([
    { key: '', value: '' },
  ]);
  const [conditions, setConditions] = useState<ConditionsState>({
    rules: [],
    logic: 'AND',
  });
  const [responseActions, setResponseActions] = useState<ResponseAction[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url || selectedEvents.length === 0) {
      toast.error('Please fill in all required fields and select at least one event');
      return;
    }

    setLoading(true);
    try {
      const headers = customHeaders.reduce((acc, header) => {
        if (header.key && header.value) {
          acc[header.key] = header.value;
        }
        return acc;
      }, {} as Record<string, string>);

      await createWebhook({
        name,
        url,
        method,
        events: selectedEvents,
        headers,
        auth_type: authType,
        auth_config: authConfig,
        conditions: (conditions.rules.length > 0 ? conditions : {}) as Record<string, string>,
        response_actions: (responseActions.length > 0 ? { actions: responseActions } : {}) as Record<string, string>,
        active: true,
      });

      toast.success('Webhook created successfully');
      onOpenChange(false);
      // Reset form
      setName('');
      setUrl('');
      setMethod('POST');
      setSelectedEvents([]);
      setAuthType('none');
      setAuthConfig({});
      setCustomHeaders([{ key: '', value: '' }]);
      setConditions({ rules: [], logic: 'AND' });
      setResponseActions([]);
    } catch (error) {
      logger.error('Error creating webhook:', error);
      toast.error('Failed to create webhook');
    } finally {
      setLoading(false);
    }
  };

  const handleEventToggle = (eventValue: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventValue)
        ? prev.filter((e) => e !== eventValue)
        : [...prev, eventValue]
    );
  };

  const addHeader = () => {
    setCustomHeaders([...customHeaders, { key: '', value: '' }]);
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...customHeaders];
    newHeaders[index][field] = value;
    setCustomHeaders(newHeaders);
  };

  const removeHeader = (index: number) => {
    setCustomHeaders(customHeaders.filter((_, i) => i !== index));
  };

  const getSamplePayload = () => {
    return {
      event: selectedEvents[0] || 'event.type',
      timestamp: new Date().toISOString(),
      data: {
        id: 'example-id',
        ...(selectedEvents[0]?.includes('lead') && {
          name: 'John Doe',
          email: 'john@example.com',
          status: 'new',
        }),
        ...(selectedEvents[0]?.includes('conversation') && {
          agent_id: 'agent-123',
          status: 'active',
        }),
      },
    };
  };

  const getPreviewHeaders = () => {
    const previewHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Lovable-Webhook/1.0',
    };

    customHeaders.forEach(header => {
      if (header.key && header.value) {
        previewHeaders[header.key] = header.value;
      }
    });

    if (authType === 'api_key' && authConfig.header_name && authConfig.api_key) {
      previewHeaders[authConfig.header_name] = '••••••••';
    } else if (authType === 'bearer_token' && authConfig.token) {
      previewHeaders['Authorization'] = 'Bearer ••••••••';
    } else if (authType === 'basic_auth' && authConfig.username && authConfig.password) {
      previewHeaders['Authorization'] = 'Basic ••••••••';
    }

    return previewHeaders;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Webhook</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="auth">Authentication</TabsTrigger>
              <TabsTrigger value="conditions">Conditions</TabsTrigger>
              <TabsTrigger value="actions">Response Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="My API Webhook"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://api.example.com/webhook"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">HTTP Method *</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HTTP_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label>Events *</Label>
                <div className="space-y-2">
                  {AVAILABLE_EVENTS.map((event) => (
                    <div key={event.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={event.value}
                        checked={selectedEvents.includes(event.value)}
                        onCheckedChange={() => handleEventToggle(event.value)}
                      />
                      <Label htmlFor={event.value} className="font-normal cursor-pointer">
                        {event.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label>Custom Headers (Optional)</Label>
                {customHeaders.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Header name"
                      value={header.key}
                      onChange={(e) => updateHeader(index, 'key', e.target.value)}
                    />
                    <Input
                      placeholder="Header value"
                      value={header.value}
                      onChange={(e) => updateHeader(index, 'value', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeHeader(index)}
                      disabled={customHeaders.length === 1}
                      aria-label="Remove header"
                    >
                      <span aria-hidden="true">✕</span>
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addHeader}>
                  + Add Header
                </Button>
              </div>
            </div>
            </TabsContent>

            <TabsContent value="auth" className="space-y-4 pt-4">
              <Label>Authentication</Label>
              <RadioGroup value={authType} onValueChange={(value) => {
                setAuthType(value);
                setAuthConfig({});
              }}>
                <div className="flex flex-wrap gap-4">
                  {AUTH_TYPES.map((type) => (
                    <RadioGroupItem key={type.value} value={type.value}>
                      {type.label}
                    </RadioGroupItem>
                  ))}
                </div>
              </RadioGroup>

              {authType === 'api_key' && (
                <div className="space-y-3 pl-6 border-l-2">
                  <div className="space-y-2">
                    <Label htmlFor="header-name">Header Name</Label>
                    <Input
                      id="header-name"
                      placeholder="X-API-Key"
                      value={authConfig.header_name || ''}
                      onChange={(e) => setAuthConfig({ ...authConfig, header_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      placeholder="Enter API key"
                      value={authConfig.api_key || ''}
                      onChange={(e) => setAuthConfig({ ...authConfig, api_key: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {authType === 'bearer_token' && (
                <div className="space-y-2 pl-6 border-l-2">
                  <Label htmlFor="token">Bearer Token</Label>
                  <Input
                    id="token"
                    type="password"
                    placeholder="Enter bearer token"
                    value={authConfig.token || ''}
                    onChange={(e) => setAuthConfig({ ...authConfig, token: e.target.value })}
                  />
                </div>
              )}

              {authType === 'basic_auth' && (
                <div className="space-y-3 pl-6 border-l-2">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Enter username"
                      value={authConfig.username || ''}
                      onChange={(e) => setAuthConfig({ ...authConfig, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={authConfig.password || ''}
                      onChange={(e) => setAuthConfig({ ...authConfig, password: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="conditions" className="space-y-4 pt-4">
              <ConditionBuilder
                conditions={conditions}
                onChange={setConditions}
                eventType={selectedEvents[0] || 'lead'}
              />
            </TabsContent>

            <TabsContent value="actions" className="space-y-4 pt-4">
              <ResponseActionBuilder
                actions={responseActions}
                onChange={setResponseActions}
              />
            </TabsContent>
          </Tabs>

          {url && selectedEvents.length > 0 && (
            <div className="space-y-2 border-t pt-4 mt-4">
              <Label>Payload Preview</Label>
              <div className="bg-muted p-4 rounded-md space-y-3 font-mono text-xs">
                <div className="text-primary font-semibold">
                  {method} {url}
                </div>
                
                <div>
                  <div className="text-muted-foreground mb-1">Headers:</div>
                  <div className="pl-2 space-y-0.5">
                    {Object.entries(getPreviewHeaders()).map(([key, value]) => (
                      <div key={key} className="text-foreground/80">
                        {key}: {value}
                      </div>
                    ))}
                  </div>
                </div>

                {method !== 'GET' && method !== 'HEAD' && (
                  <div>
                    <div className="text-muted-foreground mb-1">Body:</div>
                    <pre className="pl-2 text-foreground/80 overflow-x-auto">
                      {JSON.stringify(getSamplePayload(), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Create Webhook
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};