import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash01, DotsGrid, ChevronDown, Plus } from '@untitledui/icons';
import { ToggleSettingRow } from '@/components/ui/toggle-setting-row';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import type { EmbeddedChatConfig, CustomField } from '@/hooks/useEmbeddedChatConfig';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ContactFormSectionProps {
  config: EmbeddedChatConfig;
  onConfigChange: (updates: Partial<EmbeddedChatConfig>) => void;
}

interface SortableFieldRowProps {
  field: CustomField;
  onUpdate: (updates: Partial<CustomField>) => void;
  onRemove: () => void;
}

function SortableFieldRow({ field, onUpdate, onRemove }: SortableFieldRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasExpandableContent = field.fieldType === 'checkbox' || field.fieldType === 'select' || field.placeholder;
  const needsExpansion = field.fieldType === 'checkbox' || field.fieldType === 'select';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b last:border-b-0",
        isDragging && "opacity-50 bg-muted z-50"
      )}
    >
      {/* Main row - always visible */}
      <div className="flex items-center gap-2 py-2">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded flex-shrink-0"
        >
          <DotsGrid size={16} className="text-muted-foreground" aria-hidden="true" />
        </div>

        {/* Inline editable label */}
        <Input
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="h-8 text-sm flex-1 min-w-0"
          placeholder="Field label"
        />

        {/* Type selector - compact */}
        <Select
          value={field.fieldType}
          onValueChange={(value: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox') =>
            onUpdate({
              fieldType: value,
              placeholder: value === 'checkbox' ? undefined : (field.placeholder || ''),
              richTextContent: value === 'checkbox' ? (field.richTextContent || '') : undefined,
              options: value === 'select' ? (field.options || []) : undefined,
            })
          }
        >
          <SelectTrigger className="h-8 w-[100px] text-xs flex-shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="textarea">Text Area</SelectItem>
            <SelectItem value="select">Select</SelectItem>
            <SelectItem value="checkbox">Checkbox</SelectItem>
          </SelectContent>
        </Select>

        {/* Required checkbox */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Checkbox
            id={`required-${field.id}`}
            checked={field.required}
            onCheckedChange={(checked) => onUpdate({ required: checked === true })}
          />
          <Label htmlFor={`required-${field.id}`} className="text-xs text-muted-foreground cursor-pointer">
            Req
          </Label>
        </div>

        {/* Expand button - only show if has expandable content */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 flex-shrink-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <ChevronDown
            size={16}
            className={cn(
              "text-muted-foreground transition-transform",
              isExpanded && "rotate-180"
            )}
            aria-hidden="true"
          />
        </Button>

        {/* Delete */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 flex-shrink-0"
          onClick={onRemove}
        >
          <Trash01 size={16} className="text-muted-foreground hover:text-destructive" aria-hidden="true" />
        </Button>
      </div>

      {/* Expanded settings */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="pb-3 pl-8 pr-10 space-y-2">
              {/* Placeholder - hidden for checkbox */}
              {field.fieldType !== 'checkbox' && (
                <Input
                  value={field.placeholder || ''}
                  onChange={(e) => onUpdate({ placeholder: e.target.value })}
                  placeholder="Placeholder text"
                  className="h-8 text-sm"
                />
              )}

              {/* Rich text editor for checkbox text */}
              {field.fieldType === 'checkbox' && (
                <RichTextEditor
                  content={field.richTextContent || ''}
                  onChange={(html) => onUpdate({ richTextContent: html })}
                  placeholder="By submitting, you agree to our Terms of Service..."
                  minHeight="80px"
                  minimalMode={true}
                />
              )}

              {/* Options for select fields */}
              {field.fieldType === 'select' && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Options (comma-separated)</Label>
                  <Input
                    value={field.options?.join(', ') || ''}
                    onChange={(e) => onUpdate({
                      options: e.target.value.split(',').map(o => o.trim()).filter(Boolean)
                    })}
                    placeholder="Option 1, Option 2, Option 3"
                    className="h-8 text-sm"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const ContactFormSection = ({ config, onConfigChange }: ContactFormSectionProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = config.customFields.findIndex(f => f.id === active.id);
      const newIndex = config.customFields.findIndex(f => f.id === over.id);

      const reorderedFields = arrayMove(config.customFields, oldIndex, newIndex);
      onConfigChange({ customFields: reorderedFields });
    }
  };

  const addCustomField = () => {
    const newField: CustomField = {
      id: `field-${Date.now()}`,
      label: '',
      fieldType: 'text',
      required: false,
      placeholder: '',
    };

    onConfigChange({
      customFields: [...config.customFields, newField],
    });
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

          {/* Custom Fields Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Custom Fields</CardTitle>
                <span className="text-xs text-muted-foreground">First, Last, Email are default</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {config.customFields.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No custom fields yet
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={config.customFields.map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div>
                      {config.customFields.map((field) => (
                        <SortableFieldRow
                          key={field.id}
                          field={field}
                          onUpdate={(updates) => updateCustomField(field.id, updates)}
                          onRemove={() => removeCustomField(field.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={addCustomField}
                className="w-full mt-2"
              >
                <Plus size={16} className="mr-2" aria-hidden="true" />
                Add Field
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
