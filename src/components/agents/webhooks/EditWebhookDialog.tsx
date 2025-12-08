import { useState, useEffect } from 'react';
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
import { toast } from '@/lib/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConditionBuilder } from './ConditionBuilder';
import { ResponseActionBuilder } from './ResponseActionBuilder';
import type { Tables } from '@/integrations/supabase/types';
import { logger } from '@/utils/logger';

type Webhook = Tables<'webhooks'>;

interface EditWebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhook: Webhook | null;
  onSave: (id: string, updates: any) => Promise<void>;
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

export const EditWebhookDialog = ({ open, onOpenChange, webhook, onSave }: EditWebhookDialogProps) => {
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
  const [conditions, setConditions] = useState<{ rules: any[]; logic: string }>({
    rules: [],
    logic: 'AND',
  });
  const [responseActions, setResponseActions] = useState<any[]>([]);

  // Populate form when webhook changes
  useEffect(() => {
    if (webhook) {
      setName(webhook.name);
      setUrl(webhook.url);
      setMethod(webhook.method);
      setSelectedEvents(webhook.events || []);
      setAuthType(webhook.auth_type);
      setAuthConfig((webhook.auth_config as Record<string, string>) || {});
      
      // Convert headers object to array format
      const headersObj = (webhook.headers as Record<string, string>) || {};
      const headersArray = Object.entries(headersObj).map(([key, value]) => ({ key, value }));
      setCustomHeaders(headersArray.length > 0 ? headersArray : [{ key: '', value: '' }]);
      
      // Handle conditions
      const webhookConditions = webhook.conditions as { rules?: any[]; logic?: string } | null;
      setConditions({
        rules: webhookConditions?.rules || [],
        logic: webhookConditions?.logic || 'AND',
      });
      
      // Handle response actions
      const webhookActions = webhook.response_actions as { actions?: any[] } | null;
      setResponseActions(webhookActions?.actions || []);
    }
  }, [webhook]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhook || !name || !url || selectedEvents.length === 0) {
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

      await onSave(webhook.id, {
        name,
        url,
        method,
        events: selectedEvents,
        headers,
        auth_type: authType,
        auth_config: authConfig,
        conditions: conditions.rules.length > 0 ? conditions : {},
        response_actions: responseActions.length > 0 ? { actions: responseActions } : {},
      });

      toast.success('Webhook updated successfully');
      onOpenChange(false);
    } catch (error) {
      logger.error('Error updating webhook:', error);
      toast.error('Failed to update webhook');
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

  if (!webhook) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Webhook</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
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
                          id={`edit-${event.value}`}
                          checked={selectedEvents.includes(event.value)}
                          onCheckedChange={() => handleEventToggle(event.value)}
                        />
                        <Label htmlFor={`edit-${event.value}`} className="font-normal cursor-pointer">
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
                      >
                        ✕
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
                    <Label htmlFor="edit-header-name">Header Name</Label>
                    <Input
                      id="edit-header-name"
                      placeholder="X-API-Key"
                      value={authConfig.header_name || ''}
                      onChange={(e) => setAuthConfig({ ...authConfig, header_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-api-key">API Key</Label>
                    <Input
                      id="edit-api-key"
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
                  <Label htmlFor="edit-token">Bearer Token</Label>
                  <Input
                    id="edit-token"
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
                    <Label htmlFor="edit-username">Username</Label>
                    <Input
                      id="edit-username"
                      placeholder="Enter username"
                      value={authConfig.username || ''}
                      onChange={(e) => setAuthConfig({ ...authConfig, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-password">Password</Label>
                    <Input
                      id="edit-password"
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
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
