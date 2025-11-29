import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Link03 } from '@untitledui/icons';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { WidgetConfigurator } from '../WidgetConfigurator';
import { useOrganization } from '@/contexts/OrganizationContext';

type Agent = Tables<'agents'>;

interface AgentDeploymentTabProps {
  agent: Agent;
  onUpdate: (id: string, updates: any) => Promise<any>;
  onFormChange?: (hasChanges: boolean) => void;
}

export const AgentDeploymentTab = ({ agent, onUpdate, onFormChange }: AgentDeploymentTabProps) => {
  const { currentOrg } = useOrganization();
  const deploymentConfig = (agent.deployment_config as any) || {
    api_enabled: false,
    widget_enabled: false,
    hosted_page_enabled: false,
  };

  const [config, setConfig] = useState(deploymentConfig);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const agentSlug = agent.name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
  const apiEndpoint = `https://mvaimvwdukpgvkifkfpa.supabase.co/functions/v1/widget-chat`;
  const hostedUrl = currentOrg ? `${window.location.origin}/${currentOrg.slug}/${agentSlug}` : `Loading...`;

  const hasChanges = JSON.stringify(config) !== JSON.stringify(deploymentConfig);

  useEffect(() => {
    onFormChange?.(hasChanges);
  }, [hasChanges, onFormChange]);

  // Export save function for parent
  (AgentDeploymentTab as any).handleSave = async () => {
    if (hasChanges) {
      await onUpdate(agent.id, { deployment_config: config });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* API Access */}
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

      {/* Chat Widget */}
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
          <CardContent className="space-y-4">
            <WidgetConfigurator agentId={agent.id} />
          </CardContent>
        )}
      </Card>

      {/* Hosted Chat Page */}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(hostedUrl, '_blank')}
                >
                  <Link03 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this URL to give users direct access to your agent. The URL is based on your organization slug and agent name.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
