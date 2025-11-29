import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy01 } from '@untitledui/icons';
import type { EmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { toast } from 'sonner';

interface EmbedSettingsPanelProps {
  config: EmbeddedChatConfig;
  onConfigChange: (updates: Partial<EmbeddedChatConfig>) => void;
  embedCode: string;
}

export const EmbedSettingsPanel = ({ config, onConfigChange, embedCode }: EmbedSettingsPanelProps) => {
  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    toast.success('Embed code copied to clipboard');
  };

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["appearance"]} className="w-full">
        {/* Appearance Section */}
        <AccordionItem value="appearance">
          <AccordionTrigger className="text-sm font-medium">Appearance</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="primary-color" className="text-xs">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => onConfigChange({ primaryColor: e.target.value })}
                    className="w-16 h-9 cursor-pointer"
                  />
                  <Input
                    value={config.primaryColor}
                    onChange={(e) => onConfigChange({ primaryColor: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-color" className="text-xs">Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={config.secondaryColor}
                    onChange={(e) => onConfigChange({ secondaryColor: e.target.value })}
                    className="w-16 h-9 cursor-pointer"
                  />
                  <Input
                    value={config.secondaryColor}
                    onChange={(e) => onConfigChange({ secondaryColor: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position" className="text-xs">Chat Position</Label>
              <Select value={config.position} onValueChange={(value: any) => onConfigChange({ position: value })}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="top-left">Top Left</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="animation" className="text-xs">Bubble Animation</Label>
              <Select value={config.animation} onValueChange={(value: any) => onConfigChange({ animation: value })}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="ring">Pulse Ring</SelectItem>
                  <SelectItem value="pulse">Pulse</SelectItem>
                  <SelectItem value="bounce">Bounce</SelectItem>
                  <SelectItem value="fade">Fade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="badge" className="text-xs">Notification Badge</Label>
                <p className="text-[10px] text-muted-foreground">Show availability dot</p>
              </div>
              <Switch
                id="badge"
                checked={config.showBadge}
                onCheckedChange={(checked) => onConfigChange({ showBadge: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="teaser" className="text-xs">Conversation Teaser</Label>
                <p className="text-[10px] text-muted-foreground">Show preview text</p>
              </div>
              <Switch
                id="teaser"
                checked={config.showTeaser}
                onCheckedChange={(checked) => onConfigChange({ showTeaser: checked })}
              />
            </div>

            {config.showTeaser && (
              <div className="space-y-2 pl-4 border-l-2">
                <Label htmlFor="teaser-text" className="text-xs">Teaser Text</Label>
                <Input
                  id="teaser-text"
                  value={config.teaserText}
                  onChange={(e) => onConfigChange({ teaserText: e.target.value })}
                  placeholder="Need help? Chat with us!"
                  className="text-xs"
                  maxLength={50}
                />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Messages & Content Section */}
        <AccordionItem value="messages">
          <AccordionTrigger className="text-sm font-medium">Messages & Content</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="greeting" className="text-xs">Greeting Message</Label>
              <Textarea
                id="greeting"
                value={config.greeting}
                onChange={(e) => onConfigChange({ greeting: e.target.value })}
                placeholder="Hi! How can I help you today?"
                rows={2}
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="placeholder" className="text-xs">Input Placeholder</Label>
              <Input
                id="placeholder"
                value={config.placeholder}
                onChange={(e) => onConfigChange({ placeholder: e.target.value })}
                placeholder="Type your message..."
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-name" className="text-xs">Agent Name</Label>
              <Input
                id="agent-name"
                value={config.agentName}
                onChange={(e) => onConfigChange({ agentName: e.target.value })}
                placeholder="AI Assistant"
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcome-emoji" className="text-xs">Welcome Emoji</Label>
              <Input
                id="welcome-emoji"
                value={config.welcomeEmoji}
                onChange={(e) => onConfigChange({ welcomeEmoji: e.target.value })}
                placeholder="👋"
                maxLength={2}
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcome-title" className="text-xs">Welcome Title</Label>
              <Input
                id="welcome-title"
                value={config.welcomeTitle}
                onChange={(e) => onConfigChange({ welcomeTitle: e.target.value })}
                placeholder="Hi"
                className="text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcome-subtitle" className="text-xs">Welcome Subtitle</Label>
              <Input
                id="welcome-subtitle"
                value={config.welcomeSubtitle}
                onChange={(e) => onConfigChange({ welcomeSubtitle: e.target.value })}
                placeholder="How can we help you today?"
                className="text-xs"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="gradient" className="text-xs">Gradient Header</Label>
                <p className="text-[10px] text-muted-foreground">Use gradient effect</p>
              </div>
              <Switch
                id="gradient"
                checked={config.useGradientHeader}
                onCheckedChange={(checked) => onConfigChange({ useGradientHeader: checked })}
              />
            </div>

            {config.useGradientHeader && (
              <div className="space-y-2 pl-4 border-l-2">
                <Label htmlFor="gradient-end" className="text-xs">Gradient End Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="gradient-end"
                    type="color"
                    value={config.gradientEndColor}
                    onChange={(e) => onConfigChange({ gradientEndColor: e.target.value })}
                    className="w-16 h-9 cursor-pointer"
                  />
                  <Input
                    value={config.gradientEndColor}
                    onChange={(e) => onConfigChange({ gradientEndColor: e.target.value })}
                    className="text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="quick-actions" className="text-xs">Quick Actions</Label>
                <p className="text-[10px] text-muted-foreground">Show action cards</p>
              </div>
              <Switch
                id="quick-actions"
                checked={config.showQuickActions}
                onCheckedChange={(checked) => onConfigChange({ showQuickActions: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="bottom-nav" className="text-xs">Bottom Navigation</Label>
                <p className="text-[10px] text-muted-foreground">Show nav bar</p>
              </div>
              <Switch
                id="bottom-nav"
                checked={config.showBottomNav}
                onCheckedChange={(checked) => onConfigChange({ showBottomNav: checked })}
              />
            </div>

            {config.showBottomNav && (
              <div className="space-y-3 pl-4 border-l-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="messages-tab" className="text-xs">Messages Tab</Label>
                  <Switch
                    id="messages-tab"
                    checked={config.enableMessagesTab}
                    onCheckedChange={(checked) => onConfigChange({ enableMessagesTab: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="help-tab" className="text-xs">Help Tab</Label>
                  <Switch
                    id="help-tab"
                    checked={config.enableHelpTab}
                    onCheckedChange={(checked) => onConfigChange({ enableHelpTab: checked })}
                  />
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Features Section */}
        <AccordionItem value="features">
          <AccordionTrigger className="text-sm font-medium">Features</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="audio" className="text-xs">Audio Messages</Label>
                <p className="text-[10px] text-muted-foreground">Voice recording</p>
              </div>
              <Switch
                id="audio"
                checked={config.enableAudioMessages}
                onCheckedChange={(checked) => onConfigChange({ enableAudioMessages: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="files" className="text-xs">File Attachments</Label>
                <p className="text-[10px] text-muted-foreground">Upload files</p>
              </div>
              <Switch
                id="files"
                checked={config.enableFileAttachments}
                onCheckedChange={(checked) => onConfigChange({ enableFileAttachments: checked })}
              />
            </div>

            {config.enableFileAttachments && (
              <div className="space-y-2 pl-4 border-l-2">
                <Label htmlFor="max-file-size" className="text-xs">Max File Size (MB)</Label>
                <Input
                  id="max-file-size"
                  type="number"
                  min="1"
                  max="50"
                  value={config.maxFileSize}
                  onChange={(e) => onConfigChange({ maxFileSize: parseInt(e.target.value) })}
                  className="text-xs"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reactions" className="text-xs">Emoji Reactions</Label>
                <p className="text-[10px] text-muted-foreground">React to messages</p>
              </div>
              <Switch
                id="reactions"
                checked={config.enableEmojiReactions}
                onCheckedChange={(checked) => onConfigChange({ enableEmojiReactions: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="typing" className="text-xs">Typing Indicator</Label>
                <p className="text-[10px] text-muted-foreground">Show typing dots</p>
              </div>
              <Switch
                id="typing"
                checked={config.showTypingIndicator}
                onCheckedChange={(checked) => onConfigChange({ showTypingIndicator: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="receipts" className="text-xs">Read Receipts</Label>
                <p className="text-[10px] text-muted-foreground">Show checkmarks</p>
              </div>
              <Switch
                id="receipts"
                checked={config.showReadReceipts}
                onCheckedChange={(checked) => onConfigChange({ showReadReceipts: checked })}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Installation Section */}
        <AccordionItem value="installation">
          <AccordionTrigger className="text-sm font-medium">Installation</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs">Embed Code</Label>
              <div className="relative">
                <Textarea
                  value={embedCode}
                  readOnly
                  rows={8}
                  className="font-mono text-[10px] pr-10"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyEmbedCode}
                  className="absolute top-2 right-2"
                >
                  <Copy01 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-2 p-3 bg-muted/50 rounded-lg text-xs">
              <p className="font-medium">Installation Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-muted-foreground">
                <li>Copy the embed code above</li>
                <li>Paste it before the closing &lt;/body&gt; tag</li>
                <li>The chat widget will appear automatically</li>
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
