import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy01, Plus, Trash01 } from '@untitledui/icons';
import type { EmbeddedChatConfig, CustomField } from '@/hooks/useEmbeddedChatConfig';
import { toast } from 'sonner';

interface EmbedSettingsPanelProps {
  config: EmbeddedChatConfig;
  onConfigChange: (updates: Partial<EmbeddedChatConfig>) => void;
  embedCode: string;
}

export const EmbedSettingsPanel = ({ config, onConfigChange, embedCode }: EmbedSettingsPanelProps) => {
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'email' | 'phone' | 'textarea' | 'select'>('text');
  
  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    toast.success('Embed code copied to clipboard');
  };

  const addCustomField = () => {
    if (!newFieldLabel.trim()) return;
    
    const newField: CustomField = {
      id: `field-${Date.now()}`,
      label: newFieldLabel,
      fieldType: newFieldType,
      required: false,
      placeholder: '',
      options: newFieldType === 'select' ? [] : undefined,
    };
    
    onConfigChange({
      customFields: [...config.customFields, newField],
    });
    
    setNewFieldLabel('');
    setNewFieldType('text');
  };

  const removeCustomField = (fieldId: string) => {
    onConfigChange({
      customFields: config.customFields.filter(f => f.id !== fieldId),
    });
  };

  const updateCustomField = (fieldId: string, updates: Partial<CustomField>) => {
    onConfigChange({
      customFields: config.customFields.map(f => 
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    });
  };

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible defaultValue="appearance" className="w-full">
        {/* Appearance Section */}
        <AccordionItem value="appearance">
          <AccordionTrigger className="text-sm font-medium">Appearance</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="primary-color" className="text-sm">Primary Color</Label>
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
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-color" className="text-sm">Secondary Color</Label>
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
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position" className="text-sm">Chat Position</Label>
              <Select value={config.position} onValueChange={(value: any) => onConfigChange({ position: value })}>
                <SelectTrigger className="text-sm">
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
              <Label htmlFor="animation" className="text-sm">Bubble Animation</Label>
              <Select value={config.animation} onValueChange={(value: any) => onConfigChange({ animation: value })}>
                <SelectTrigger className="text-sm">
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
                <Label htmlFor="badge" className="text-sm">Notification Badge</Label>
                <p className="text-xs text-muted-foreground">Show availability dot</p>
              </div>
              <Switch
                id="badge"
                checked={config.showBadge}
                onCheckedChange={(checked) => onConfigChange({ showBadge: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="teaser" className="text-sm">Conversation Teaser</Label>
                <p className="text-xs text-muted-foreground">Show preview text</p>
              </div>
              <Switch
                id="teaser"
                checked={config.showTeaser}
                onCheckedChange={(checked) => onConfigChange({ showTeaser: checked })}
              />
            </div>

            {config.showTeaser && (
              <div className="space-y-2 pl-4 border-l-2">
                <Label htmlFor="teaser-text" className="text-sm">Teaser Text</Label>
                <Input
                  id="teaser-text"
                  value={config.teaserText}
                  onChange={(e) => onConfigChange({ teaserText: e.target.value })}
                  placeholder="Need help? Chat with us!"
                  className="text-sm"
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
              <Label htmlFor="greeting" className="text-sm">Greeting Message</Label>
              <Textarea
                id="greeting"
                value={config.greeting}
                onChange={(e) => onConfigChange({ greeting: e.target.value })}
                placeholder="Hi! How can I help you today?"
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="placeholder" className="text-sm">Input Placeholder</Label>
              <Input
                id="placeholder"
                value={config.placeholder}
                onChange={(e) => onConfigChange({ placeholder: e.target.value })}
                placeholder="Type your message..."
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-name" className="text-sm">Agent Name</Label>
              <Input
                id="agent-name"
                value={config.agentName}
                onChange={(e) => onConfigChange({ agentName: e.target.value })}
                placeholder="AI Assistant"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcome-emoji" className="text-sm">Welcome Emoji</Label>
              <Input
                id="welcome-emoji"
                value={config.welcomeEmoji}
                onChange={(e) => onConfigChange({ welcomeEmoji: e.target.value })}
                placeholder="👋"
                maxLength={2}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcome-title" className="text-sm">Welcome Title</Label>
              <Input
                id="welcome-title"
                value={config.welcomeTitle}
                onChange={(e) => onConfigChange({ welcomeTitle: e.target.value })}
                placeholder="Hi"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcome-subtitle" className="text-sm">Welcome Subtitle</Label>
              <Input
                id="welcome-subtitle"
                value={config.welcomeSubtitle}
                onChange={(e) => onConfigChange({ welcomeSubtitle: e.target.value })}
                placeholder="How can we help you today?"
                className="text-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="gradient" className="text-sm">Gradient Header</Label>
                <p className="text-xs text-muted-foreground">Use gradient effect</p>
              </div>
              <Switch
                id="gradient"
                checked={config.useGradientHeader}
                onCheckedChange={(checked) => onConfigChange({ useGradientHeader: checked })}
              />
            </div>

            {config.useGradientHeader && (
              <div className="space-y-2 pl-4 border-l-2">
                <Label htmlFor="gradient-end" className="text-sm">Gradient End Color</Label>
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
                    className="text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="quick-actions" className="text-sm">Quick Actions</Label>
                <p className="text-xs text-muted-foreground">Show action cards</p>
              </div>
              <Switch
                id="quick-actions"
                checked={config.showQuickActions}
                onCheckedChange={(checked) => onConfigChange({ showQuickActions: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="bottom-nav" className="text-sm">Bottom Navigation</Label>
                <p className="text-xs text-muted-foreground">Show nav bar</p>
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
                  <Label htmlFor="messages-tab" className="text-sm">Messages Tab</Label>
                  <Switch
                    id="messages-tab"
                    checked={config.enableMessagesTab}
                    onCheckedChange={(checked) => onConfigChange({ enableMessagesTab: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="help-tab" className="text-sm">Help Tab</Label>
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

        {/* Contact Form Section */}
        <AccordionItem value="contact-form">
          <AccordionTrigger className="text-sm font-medium">Contact Form</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="contact-form" className="text-sm">Enable Contact Form</Label>
                <p className="text-xs text-muted-foreground">Collect user info before chat</p>
              </div>
              <Switch
                id="contact-form"
                checked={config.enableContactForm}
                onCheckedChange={(checked) => onConfigChange({ enableContactForm: checked })}
              />
            </div>

            {config.enableContactForm && (
              <div className="space-y-4 pl-4 border-l-2">
                <div className="space-y-2">
                  <Label htmlFor="form-title" className="text-sm">Form Title</Label>
                  <Input
                    id="form-title"
                    value={config.contactFormTitle}
                    onChange={(e) => onConfigChange({ contactFormTitle: e.target.value })}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-subtitle" className="text-sm">Form Subtitle</Label>
                  <Textarea
                    id="form-subtitle"
                    value={config.contactFormSubtitle}
                    onChange={(e) => onConfigChange({ contactFormSubtitle: e.target.value })}
                    rows={2}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Custom Fields</Label>
                    <p className="text-xs text-muted-foreground">First, Last, Email are default</p>
                  </div>

                  {/* Existing Custom Fields */}
                  {config.customFields.map((field) => (
                    <div key={field.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <Input
                          value={field.label}
                          onChange={(e) => updateCustomField(field.id, { label: e.target.value })}
                          className="text-sm flex-1 mr-2"
                          placeholder="Field label"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCustomField(field.id)}
                        >
                          <Trash01 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Select
                          value={field.fieldType}
                          onValueChange={(value: any) => updateCustomField(field.id, { fieldType: value })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="textarea">Text Area</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.required}
                            onCheckedChange={(checked) => updateCustomField(field.id, { required: checked })}
                          />
                          <Label className="text-xs">Required</Label>
                        </div>
                      </div>

                      <Input
                        value={field.placeholder || ''}
                        onChange={(e) => updateCustomField(field.id, { placeholder: e.target.value })}
                        placeholder="Placeholder text"
                        className="text-sm"
                      />

                      {field.fieldType === 'select' && (
                        <div className="space-y-2">
                          <Label className="text-xs">Options (comma-separated)</Label>
                          <Input
                            value={field.options?.join(', ') || ''}
                            onChange={(e) => updateCustomField(field.id, { 
                              options: e.target.value.split(',').map(o => o.trim()).filter(Boolean) 
                            })}
                            placeholder="Option 1, Option 2, Option 3"
                            className="text-sm"
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add New Field */}
                  <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                    <Label className="text-sm">Add Custom Field</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        placeholder="Field label"
                        className="text-sm"
                      />
                      <Select
                        value={newFieldType}
                        onValueChange={(value: any) => setNewFieldType(value)}
                      >
                        <SelectTrigger className="text-sm w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="textarea">Text Area</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addCustomField}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Field
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Features Section */}
        <AccordionItem value="features">
          <AccordionTrigger className="text-sm font-medium">Features</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="transitions" className="text-sm">View Transitions</Label>
              <Select 
                value={config.viewTransition} 
                onValueChange={(value: any) => onConfigChange({ viewTransition: value })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slide">Slide</SelectItem>
                  <SelectItem value="fade">Fade</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="audio" className="text-sm">Audio Messages</Label>
                <p className="text-xs text-muted-foreground">Voice recording</p>
              </div>
              <Switch
                id="audio"
                checked={config.enableAudioMessages}
                onCheckedChange={(checked) => onConfigChange({ enableAudioMessages: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="files" className="text-sm">File Attachments</Label>
                <p className="text-xs text-muted-foreground">Upload files</p>
              </div>
              <Switch
                id="files"
                checked={config.enableFileAttachments}
                onCheckedChange={(checked) => onConfigChange({ enableFileAttachments: checked })}
              />
            </div>

            {config.enableFileAttachments && (
              <div className="space-y-2 pl-4 border-l-2">
                <Label htmlFor="max-file-size" className="text-sm">Max File Size (MB)</Label>
                <Input
                  id="max-file-size"
                  type="number"
                  min="1"
                  max="50"
                  value={config.maxFileSize}
                  onChange={(e) => onConfigChange({ maxFileSize: parseInt(e.target.value) })}
                  className="text-sm"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reactions" className="text-sm">Emoji Reactions</Label>
                <p className="text-xs text-muted-foreground">React to messages</p>
              </div>
              <Switch
                id="reactions"
                checked={config.enableEmojiReactions}
                onCheckedChange={(checked) => onConfigChange({ enableEmojiReactions: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="typing" className="text-sm">Typing Indicator</Label>
                <p className="text-xs text-muted-foreground">Show typing dots</p>
              </div>
              <Switch
                id="typing"
                checked={config.showTypingIndicator}
                onCheckedChange={(checked) => onConfigChange({ showTypingIndicator: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="receipts" className="text-sm">Read Receipts</Label>
                <p className="text-xs text-muted-foreground">Show checkmarks</p>
              </div>
              <Switch
                id="receipts"
                checked={config.showReadReceipts}
                onCheckedChange={(checked) => onConfigChange({ showReadReceipts: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="chat-settings" className="text-sm">Chat Settings</Label>
                <p className="text-xs text-muted-foreground">User controls</p>
              </div>
              <Switch
                id="chat-settings"
                checked={config.enableChatSettings}
                onCheckedChange={(checked) => onConfigChange({ enableChatSettings: checked })}
              />
            </div>

            {config.enableChatSettings && (
              <div className="space-y-3 pl-4 border-l-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="default-sound" className="text-sm">Sound by Default</Label>
                  <Switch
                    id="default-sound"
                    checked={config.defaultSoundEnabled}
                    onCheckedChange={(checked) => onConfigChange({ defaultSoundEnabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="default-scroll" className="text-sm">Auto-Scroll by Default</Label>
                  <Switch
                    id="default-scroll"
                    checked={config.defaultAutoScroll}
                    onCheckedChange={(checked) => onConfigChange({ defaultAutoScroll: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="default-compact" className="text-sm">Compact Mode by Default</Label>
                  <Switch
                    id="default-compact"
                    checked={config.defaultCompactMode}
                    onCheckedChange={(checked) => onConfigChange({ defaultCompactMode: checked })}
                  />
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Installation Section */}
        <AccordionItem value="installation">
          <AccordionTrigger className="text-sm font-medium">Installation</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-sm">Embed Code</Label>
              <div className="relative">
                <Textarea
                  value={embedCode}
                  readOnly
                  rows={8}
                  className="font-mono text-xs pr-10"
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

            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Installation Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-muted-foreground">
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
