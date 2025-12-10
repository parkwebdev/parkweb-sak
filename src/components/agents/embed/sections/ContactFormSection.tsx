import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash01 } from '@untitledui/icons';
import { ToggleSettingRow } from '@/components/ui/toggle-setting-row';
import type { EmbeddedChatConfig, CustomField } from '@/hooks/useEmbeddedChatConfig';

interface ContactFormSectionProps {
  config: EmbeddedChatConfig;
  onConfigChange: (updates: Partial<EmbeddedChatConfig>) => void;
}

export const ContactFormSection = ({ config, onConfigChange }: ContactFormSectionProps) => {
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'email' | 'phone' | 'textarea' | 'select'>('text');

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
    <div className="space-y-6">
      <ToggleSettingRow
        id="contact-form"
        label="Enable Contact Form"
        description="Collect user info before chat"
        checked={config.enableContactForm}
        onCheckedChange={(checked) => onConfigChange({ enableContactForm: checked })}
      />

      {config.enableContactForm && (
        <div className="space-y-6 pl-4 border-l-2">
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

          <div className="space-y-4">
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
                    onValueChange={(value: 'text' | 'email' | 'phone' | 'textarea' | 'select') => 
                      updateCustomField(field.id, { fieldType: value })
                    }
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
                  onValueChange={(value: 'text' | 'email' | 'phone' | 'textarea' | 'select') => 
                    setNewFieldType(value)
                  }
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
    </div>
  );
};
