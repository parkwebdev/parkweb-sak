import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy01, Save01 } from '@untitledui/icons';
import { useEmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { EmbeddedChatPreview } from './EmbeddedChatPreview';
import { useToast } from '@/hooks/use-toast';

interface EmbeddedChatDesignerProps {
  agentId: string;
}

export const EmbeddedChatDesigner = ({ agentId }: EmbeddedChatDesignerProps) => {
  const { config, loading, saveConfig, generateEmbedCode } = useEmbeddedChatConfig(agentId);
  const { toast } = useToast();

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
    return <div className="text-center py-8">Loading chat configuration...</div>;
  }

  return (
    <div className="space-y-6 pb-6">
      <SheetHeader>
        <SheetTitle>Chat Customization</SheetTitle>
        <SheetDescription>Design how your embedded chat looks and behaves</SheetDescription>
      </SheetHeader>

      {/* Appearance Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Appearance</h3>
        
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
        <Label htmlFor="position">Chat Position</Label>
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

      <div className="space-y-2">
        <Label htmlFor="animation">Bubble Animation</Label>
        <Select value={config.animation} onValueChange={(value: any) => saveConfig({ animation: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="pulse">Pulse</SelectItem>
            <SelectItem value="bounce">Bounce</SelectItem>
            <SelectItem value="fade">Fade</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Add motion to attract attention</p>
      </div>
      </div>

      <Separator />

      {/* Messages Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Messages</h3>
        
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
      </div>

      <Separator />

      {/* Branding Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Branding</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="branding">Show "Powered by" Badge</Label>
            <p className="text-xs text-muted-foreground">
              Display branding in the chat
            </p>
          </div>
          <Switch
            id="branding"
            checked={config.showBranding}
            onCheckedChange={(checked) => saveConfig({ showBranding: checked })}
          />
        </div>
      </div>

      <Separator />

      {/* Preview Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Live Preview</h3>
        <EmbeddedChatPreview config={config} />
      </div>

      <Separator />

      {/* Embed Code Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Embed Code</h3>
        
        <div className="relative">
          <pre className="p-3 bg-muted rounded-lg overflow-x-auto text-xs">
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

        <div className="p-3 border rounded-lg bg-accent/30">
          <h4 className="text-sm font-medium mb-2">Installation Instructions</h4>
          <ol className="text-xs space-y-1 list-decimal list-inside text-muted-foreground">
            <li>Copy the embed code above</li>
            <li>Paste it into your website's HTML before the closing {'</body>'} tag</li>
            <li>The chat will automatically load on your website</li>
            <li>Users can start chatting with your AI agent immediately</li>
          </ol>
        </div>
      </div>

      <Button onClick={handleSave} className="w-full">
        <Save01 className="h-4 w-4 mr-2" />
        Save Configuration
      </Button>
    </div>
  );
};
