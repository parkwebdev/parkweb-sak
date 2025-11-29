import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings01 } from '@untitledui/icons';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { WidgetConfigurator } from '../WidgetConfigurator';

type Agent = Tables<'agents'>;

interface AgentDeploymentTabProps {
  agent: Agent;
  onUpdate: (id: string, updates: any) => Promise<any>;
}

export const AgentDeploymentTab = ({ agent, onUpdate }: AgentDeploymentTabProps) => {
  const deploymentConfig = (agent.deployment_config as any) || {
    api_enabled: false,
    widget_enabled: false,
    hosted_page_enabled: false,
  };

  const [config, setConfig] = useState(deploymentConfig);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(agent.id, { deployment_config: config });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const apiEndpoint = `https://mvaimvwdukpgvkifkfpa.supabase.co/functions/v1/chat?agent_id=${agent.id}`;
  const widgetCode = `<script src="https://cdn.example.com/agent-widget.js" data-agent-id="${agent.id}"></script>`;
  const hostedUrl = `https://chat.example.com/agent/${agent.id}`;

  const hasChanges = JSON.stringify(config) !== JSON.stringify(deploymentConfig);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">
            <Settings01 className="h-4 w-4 mr-2" />
            Deployment Settings
          </TabsTrigger>
          <TabsTrigger value="widget" disabled={!config.widget_enabled}>
            Widget Configurator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>API Access</CardTitle>
                  <CardDescription>Enable REST API access to your agent</CardDescription>
                </div>
                <Switch
                  checked={config.api_enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, api_enabled: checked })}
                />
              </div>
            </CardHeader>
            {config.api_enabled && (
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>API Endpoint</Label>
                  <div className="flex gap-2">
                    <Input value={apiEndpoint} readOnly className="font-mono text-xs" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(apiEndpoint, 'API endpoint')}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this endpoint to integrate the agent into your application via REST API.
                </p>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Chat Widget</CardTitle>
                  <CardDescription>Embed a chat widget on your website</CardDescription>
                </div>
                <Switch
                  checked={config.widget_enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, widget_enabled: checked })}
                />
              </div>
            </CardHeader>
            {config.widget_enabled && (
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Widget is enabled. Use the Widget Configurator tab to customize appearance and generate embed code.
                </p>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hosted Chat Page</CardTitle>
                  <CardDescription>Standalone chat page hosted by us</CardDescription>
                </div>
                <Switch
                  checked={config.hosted_page_enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, hosted_page_enabled: checked })}
                />
              </div>
            </CardHeader>
            {config.hosted_page_enabled && (
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Hosted Page URL</Label>
                  <div className="flex gap-2">
                    <Input value={hostedUrl} readOnly className="font-mono text-xs" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(hostedUrl, 'Hosted URL')}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this URL to give users direct access to your agent.
                </p>
              </CardContent>
            )}
          </Card>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button onClick={handleSave} disabled={saving || !hasChanges}>
              {saving ? 'Saving...' : 'Save Deployment Settings'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="widget" className="mt-4">
          {config.widget_enabled && <WidgetConfigurator agentId={agent.id} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};
