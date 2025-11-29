import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code02, Eye, Save01, Copy01, Settings01 } from '@untitledui/icons';
import { useWidgetConfig } from '@/hooks/useWidgetConfig';
import { WidgetPreview } from './WidgetPreview';
import { useToast } from '@/hooks/use-toast';

interface WidgetConfiguratorProps {
  agentId: string;
}

export const WidgetConfigurator = ({ agentId }: WidgetConfiguratorProps) => {
  const { config, loading, saveConfig, generateEmbedCode } = useWidgetConfig(agentId);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('configure');

  const handleSave = async () => {
    await saveConfig(config);
  };

  const copyEmbedCode = () => {
    const code = generateEmbedCode();
    navigator.clipboard.writeText(code);
    toast({
      title: 'Code copied!',
      description: 'Embed code has been copied to clipboard',
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading widget configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configure">
            <Settings01 className="h-4 w-4 mr-2" />
            Configure
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="embed">
            <Code02 className="h-4 w-4 mr-2" />
            Embed Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how your widget looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => saveConfig({ primaryColor: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      value={config.primaryColor}
                      onChange={(e) => saveConfig({ primaryColor: e.target.value })}
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={config.secondaryColor}
                      onChange={(e) => saveConfig({ secondaryColor: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      value={config.secondaryColor}
                      onChange={(e) => saveConfig({ secondaryColor: e.target.value })}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Widget Position</Label>
                <Select value={config.position} onValueChange={(value: any) => saveConfig({ position: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="top-left">Top Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Configure widget text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="greeting">Greeting Message</Label>
                <Textarea
                  id="greeting"
                  value={config.greeting}
                  onChange={(e) => saveConfig({ greeting: e.target.value })}
                  placeholder="Hi! How can I help you today?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="placeholder">Input Placeholder</Label>
                <Input
                  id="placeholder"
                  value={config.placeholder}
                  onChange={(e) => saveConfig({ placeholder: e.target.value })}
                  placeholder="Type your message..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent-name">Agent Name</Label>
                <Input
                  id="agent-name"
                  value={config.agentName}
                  onChange={(e) => saveConfig({ agentName: e.target.value })}
                  placeholder="AI Assistant"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Control branding visibility</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="branding">Show "Powered by" Badge</Label>
                  <p className="text-sm text-muted-foreground">
                    Display branding in the widget
                  </p>
                </div>
                <Switch
                  id="branding"
                  checked={config.showBranding}
                  onCheckedChange={(checked) => saveConfig({ showBranding: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} className="w-full">
            <Save01 className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Widget Preview</CardTitle>
              <CardDescription>See how your widget will look</CardDescription>
            </CardHeader>
            <CardContent>
              <WidgetPreview config={config} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="embed">
          <Card>
            <CardHeader>
              <CardTitle>Embed Code</CardTitle>
              <CardDescription>
                Copy and paste this code into your website's HTML
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                  <code>{generateEmbedCode()}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={copyEmbedCode}
                >
                  <Copy01 className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-4 border rounded-lg bg-accent/50">
                <h4 className="font-semibold mb-2">Installation Instructions</h4>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Copy the embed code above</li>
                  <li>Paste it into your website's HTML, preferably before the closing {'</body>'} tag</li>
                  <li>The widget will automatically load on your website</li>
                  <li>Users can start chatting with your AI agent immediately</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
