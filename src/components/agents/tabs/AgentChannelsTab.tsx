import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Link03, Settings01 } from '@untitledui/icons';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import { WidgetConfigurator } from '../WidgetConfigurator';
import { useOrganization } from '@/contexts/OrganizationContext';

type Agent = Tables<'agents'>;

interface AgentChannelsTabProps {
  agent: Agent;
  onUpdate: (id: string, updates: any) => Promise<any>;
  onFormChange?: (hasChanges: boolean) => void;
}

export const AgentChannelsTab = ({ agent, onUpdate, onFormChange }: AgentChannelsTabProps) => {
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
  (AgentChannelsTab as any).handleSave = async () => {
    if (hasChanges) {
      await onUpdate(agent.id, { deployment_config: config });
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* API Access */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">API Access</h3>
            <p className="text-xs text-muted-foreground">Enable REST API access to your agent</p>
          </div>
          <Switch
            checked={config.api_enabled}
            onCheckedChange={(checked) => setConfig({ ...config, api_enabled: checked })}
          />
        </div>
        {config.api_enabled && (
          <div className="pl-4 space-y-2">
            <Label className="text-xs text-muted-foreground">API Endpoint</Label>
            <div className="flex gap-2">
              <Input value={apiEndpoint} readOnly className="font-mono text-xs h-9" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(apiEndpoint, 'API endpoint')}
              >
                Copy
              </Button>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Chat Widget */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Chat Widget</h3>
            <p className="text-xs text-muted-foreground">Embed a chat widget on your website</p>
          </div>
          <Switch
            checked={config.widget_enabled}
            onCheckedChange={(checked) => setConfig({ ...config, widget_enabled: checked })}
          />
        </div>
        {config.widget_enabled && (
          <div className="pl-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings01 className="h-4 w-4 mr-2" />
                  Configure Widget
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Widget Configuration</DialogTitle>
                </DialogHeader>
                <WidgetConfigurator agentId={agent.id} />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Separator />

      {/* Hosted Chat Page */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Hosted Chat Page</h3>
            <p className="text-xs text-muted-foreground">Standalone chat page hosted by us</p>
          </div>
          <Switch
            checked={config.hosted_page_enabled}
            onCheckedChange={(checked) => setConfig({ ...config, hosted_page_enabled: checked })}
          />
        </div>
        {config.hosted_page_enabled && (
          <div className="pl-4 space-y-2">
            <Label className="text-xs text-muted-foreground">Hosted Page URL</Label>
            <div className="flex gap-2">
              <Input value={hostedUrl} readOnly className="font-mono text-xs h-9" />
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
        )}
      </div>
    </div>
  );
};
