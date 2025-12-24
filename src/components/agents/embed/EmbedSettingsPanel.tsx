import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash01 } from '@untitledui/icons';
import { CopyButton } from '@/components/ui/copy-button';
import { ToggleSettingRow } from '@/components/ui/toggle-setting-row';
import { ColorPicker } from '@/components/ui/color-picker';
import type { EmbeddedChatConfig, CustomField } from '@/hooks/useEmbeddedChatConfig';
import { toast } from '@/lib/toast';

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
            <div className="space-y-2">
              <Label htmlFor="primary-color" className="text-sm">Text/Button Color</Label>
              <ColorPicker
                id="primary-color"
                value={config.primaryColor}
                onChange={(color) => onConfigChange({ primaryColor: color })}
                showAlpha={false}
              />
            </div>

            <ToggleSettingRow
              id="gradient"
              label="Gradient Header"
              description="Use gradient effect"
              checked={config.useGradientHeader}
              onCheckedChange={(checked) => onConfigChange({ useGradientHeader: checked })}
            />

            {config.useGradientHeader && (
              <div className="space-y-3 pl-4 border-l-2">
                <div className="space-y-2">
                  <Label htmlFor="gradient-start" className="text-sm">Primary Brand Color</Label>
                  <ColorPicker
                    id="gradient-start"
                    value={config.gradientStartColor}
                    onChange={(color) => onConfigChange({ gradientStartColor: color })}
                    showAlpha={false}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gradient-end" className="text-sm">Secondary Brand Color</Label>
                  <ColorPicker
                    id="gradient-end"
                    value={config.gradientEndColor}
                    onChange={(color) => onConfigChange({ gradientEndColor: color })}
                    showAlpha={false}
                  />
                </div>
              </div>
            )}

          </AccordionContent>
        </AccordionItem>

        {/* Messages & Content Section */}
        <AccordionItem value="messages">
          <AccordionTrigger className="text-sm font-medium">Messages & Content</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
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

            <ToggleSettingRow
              id="quick-replies"
              label="Quick Reply Suggestions"
              description="AI suggests follow-up options after responses"
              checked={config.enableQuickReplies ?? true}
              onCheckedChange={(checked) => onConfigChange({ enableQuickReplies: checked })}
            />

            <ToggleSettingRow
              id="bottom-nav"
              label="Bottom Navigation"
              description="Show nav bar"
              checked={config.showBottomNav}
              onCheckedChange={(checked) => onConfigChange({ showBottomNav: checked })}
            />

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
                  <Label htmlFor="news-tab" className="text-sm">News Tab</Label>
                  <Switch
                    id="news-tab"
                    checked={config.enableNewsTab}
                    onCheckedChange={(checked) => onConfigChange({ enableNewsTab: checked })}
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
            <ToggleSettingRow
              id="contact-form"
              label="Enable Contact Form"
              description="Collect user info before chat"
              checked={config.enableContactForm}
              onCheckedChange={(checked) => onConfigChange({ enableContactForm: checked })}
            />

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
                          onValueChange={(value: 'text' | 'email' | 'phone' | 'textarea' | 'select') => updateCustomField(field.id, { fieldType: value })}
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
                        onValueChange={(value: 'text' | 'email' | 'phone' | 'textarea' | 'select') => setNewFieldType(value)}
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
                      Add Field
                    </Button>
                  </div>
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
                <CopyButton 
                  content={embedCode} 
                  showToast={true} 
                  toastMessage="Embed code copied to clipboard"
                  className="absolute top-2 right-2"
                />
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
