import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Link03, ChevronDown, ChevronRight } from '@untitledui/icons';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { WidgetConfigurator } from '../WidgetConfigurator';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const [apiOpen, setApiOpen] = useState(false);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [hostedOpen, setHostedOpen] = useState(false);

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
    <div className="space-y-4 max-w-4xl">
      {/* API Access Card */}
      <Card>
        <Collapsible open={apiOpen || config.api_enabled} onOpenChange={setApiOpen}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 -ml-1">
                      {(apiOpen || config.api_enabled) ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  API Access
                </CardTitle>
                <CardDescription>Enable REST API access to your agent</CardDescription>
              </div>
              <Switch
                checked={config.api_enabled}
                onCheckedChange={(checked) => {
                  setConfig({ ...config, api_enabled: checked });
                  if (checked) setApiOpen(true);
                }}
              />
            </div>
          </CardHeader>
          
          <CollapsibleContent>
            {config.api_enabled && (
              <CardContent className="space-y-3 pt-0">
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
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Chat Widget Card */}
      <Card>
        <Collapsible open={widgetOpen || config.widget_enabled} onOpenChange={setWidgetOpen}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 -ml-1">
                      {(widgetOpen || config.widget_enabled) ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  Chat Widget
                </CardTitle>
                <CardDescription>Embed a chat widget on your website</CardDescription>
              </div>
              <Switch
                checked={config.widget_enabled}
                onCheckedChange={(checked) => {
                  setConfig({ ...config, widget_enabled: checked });
                  if (checked) setWidgetOpen(true);
                }}
              />
            </div>
          </CardHeader>
          
          <CollapsibleContent>
            {config.widget_enabled && (
              <CardContent className="pt-0">
                <WidgetConfigurator agentId={agent.id} />
              </CardContent>
            )}
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Hosted Chat Page Card */}
      <Card>
        <Collapsible open={hostedOpen || config.hosted_page_enabled} onOpenChange={setHostedOpen}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 -ml-1">
                      {(hostedOpen || config.hosted_page_enabled) ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  Hosted Chat Page
                </CardTitle>
                <CardDescription>Standalone chat page hosted by us</CardDescription>
              </div>
              <Switch
                checked={config.hosted_page_enabled}
                onCheckedChange={(checked) => {
                  setConfig({ ...config, hosted_page_enabled: checked });
                  if (checked) setHostedOpen(true);
                }}
              />
            </div>
          </CardHeader>
          
          <CollapsibleContent>
            {config.hosted_page_enabled && (
              <CardContent className="space-y-3 pt-0">
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
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};
