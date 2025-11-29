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
            <SelectItem value="ring">Pulse Ring (Recommended)</SelectItem>
            <SelectItem value="pulse">Pulse</SelectItem>
            <SelectItem value="bounce">Bounce</SelectItem>
            <SelectItem value="fade">Fade</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Add motion to attract attention</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="badge">Notification Badge</Label>
          <Switch
            id="badge"
            checked={config.showBadge}
            onCheckedChange={(checked) => saveConfig({ showBadge: checked })}
          />
        </div>
        <p className="text-xs text-muted-foreground">Show a dot to indicate availability</p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="teaser">Conversation Teaser</Label>
          <Switch
            id="teaser"
            checked={config.showTeaser}
            onCheckedChange={(checked) => saveConfig({ showTeaser: checked })}
          />
        </div>
        <p className="text-xs text-muted-foreground">Show preview text above chat bubble</p>
      </div>

      {config.showTeaser && (
        <div className="space-y-2 pl-4">
          <Label htmlFor="teaser-text">Teaser Text</Label>
          <Input
            id="teaser-text"
            value={config.teaserText}
            onChange={(e) => saveConfig({ teaserText: e.target.value })}
            placeholder="Need help? Chat with us!"
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">Short message to encourage engagement</p>
        </div>
      )}
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

      {/* Timing Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Display Timing</h3>
        
        <div className="space-y-2">
          <Label htmlFor="timing">When to Show</Label>
          <Select value={config.displayTiming} onValueChange={(value: any) => saveConfig({ displayTiming: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="immediate">Immediately</SelectItem>
              <SelectItem value="delayed">After Delay</SelectItem>
              <SelectItem value="scroll">On Scroll Depth</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {config.displayTiming === 'delayed' && (
          <div className="space-y-2">
            <Label htmlFor="delay">Delay (seconds)</Label>
            <Input
              id="delay"
              type="number"
              min="1"
              max="60"
              value={config.delaySeconds}
              onChange={(e) => saveConfig({ delaySeconds: parseInt(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">Show chat after this many seconds</p>
          </div>
        )}

        {config.displayTiming === 'scroll' && (
          <div className="space-y-2">
            <Label htmlFor="scroll">Scroll Depth (%)</Label>
            <Input
              id="scroll"
              type="number"
              min="10"
              max="100"
              step="10"
              value={config.scrollDepth}
              onChange={(e) => saveConfig({ scrollDepth: parseInt(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">Show chat after user scrolls this far down the page</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Home Screen Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Home Screen</h3>
        
        <div className="space-y-2">
          <Label htmlFor="welcome-emoji">Welcome Emoji</Label>
          <Input
            id="welcome-emoji"
            value={config.welcomeEmoji}
            onChange={(e) => saveConfig({ welcomeEmoji: e.target.value })}
            placeholder="👋"
            maxLength={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="welcome-title">Welcome Title</Label>
          <Input
            id="welcome-title"
            value={config.welcomeTitle}
            onChange={(e) => saveConfig({ welcomeTitle: e.target.value })}
            placeholder="Hi"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="welcome-subtitle">Welcome Subtitle</Label>
          <Input
            id="welcome-subtitle"
            value={config.welcomeSubtitle}
            onChange={(e) => saveConfig({ welcomeSubtitle: e.target.value })}
            placeholder="How can we help you today?"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="gradient">Use Gradient Header</Label>
            <Switch
              id="gradient"
              checked={config.useGradientHeader}
              onCheckedChange={(checked) => saveConfig({ useGradientHeader: checked })}
            />
          </div>
          <p className="text-xs text-muted-foreground">Apply gradient effect to header</p>
        </div>

        {config.useGradientHeader && (
          <div className="space-y-2 pl-4">
            <Label htmlFor="gradient-end">Gradient End Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="gradient-end"
                type="color"
                value={config.gradientEndColor}
                onChange={(e) => saveConfig({ gradientEndColor: e.target.value })}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                value={config.gradientEndColor}
                onChange={(e) => saveConfig({ gradientEndColor: e.target.value })}
                placeholder="#1e40af"
              />
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Quick Actions Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Quick Actions</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="quick-actions">Show Quick Actions</Label>
            <p className="text-xs text-muted-foreground">
              Display action cards on home screen
            </p>
          </div>
          <Switch
            id="quick-actions"
            checked={config.showQuickActions}
            onCheckedChange={(checked) => saveConfig({ showQuickActions: checked })}
          />
        </div>

        <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
          Quick actions like "Start a conversation" and "Browse help articles" are pre-configured. 
          Advanced customization coming soon.
        </p>
      </div>

      <Separator />

      {/* Navigation Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Navigation</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="bottom-nav">Show Bottom Navigation</Label>
            <p className="text-xs text-muted-foreground">
              Display navigation bar at bottom
            </p>
          </div>
          <Switch
            id="bottom-nav"
            checked={config.showBottomNav}
            onCheckedChange={(checked) => saveConfig({ showBottomNav: checked })}
          />
        </div>

        {config.showBottomNav && (
          <div className="space-y-2 pl-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="messages-tab">Messages Tab</Label>
              <Switch
                id="messages-tab"
                checked={config.enableMessagesTab}
                onCheckedChange={(checked) => saveConfig({ enableMessagesTab: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="help-tab">Help Tab</Label>
              <Switch
                id="help-tab"
                checked={config.enableHelpTab}
                onCheckedChange={(checked) => saveConfig({ enableHelpTab: checked })}
              />
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Real-time Indicators Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Real-time Indicators</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="typing">Typing Indicator</Label>
            <p className="text-xs text-muted-foreground">
              Show animated dots when agent is responding
            </p>
          </div>
          <Switch
            id="typing"
            checked={config.showTypingIndicator}
            onCheckedChange={(checked) => saveConfig({ showTypingIndicator: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="read-receipts">Read Receipts</Label>
            <p className="text-xs text-muted-foreground">
              Show checkmarks when messages are read
            </p>
          </div>
          <Switch
            id="read-receipts"
            checked={config.showReadReceipts}
            onCheckedChange={(checked) => saveConfig({ showReadReceipts: checked })}
          />
        </div>
      </div>

      <Separator />

      {/* Audio Messages */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Audio Messages</h3>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="audio-messages">Enable Audio Messages</Label>
            <p className="text-xs text-muted-foreground">
              Allow users to record and send voice messages
            </p>
          </div>
          <Switch
            id="audio-messages"
            checked={config.enableAudioMessages}
            onCheckedChange={(checked) => saveConfig({ enableAudioMessages: checked })}
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
