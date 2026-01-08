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
import type { EmbeddedChatConfig, CustomField, FormStep } from '@/hooks/useEmbeddedChatConfig';
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
    transform: CSS.Translate.toString(transform),
    transition,
  };

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

        {/* Expand button */}
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

/**
 * Step tab component for multi-step form management
 */
function StepTab({ 
  step, 
  stepNumber, 
  isActive, 
  onClick, 
  onRemove,
  canRemove 
}: { 
  step: FormStep; 
  stepNumber: number; 
  isActive: boolean; 
  onClick: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors group",
        isActive 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted hover:bg-muted/80 text-muted-foreground"
      )}
    >
      Step {stepNumber}
      {canRemove && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              onRemove();
            }
          }}
          className={cn(
            "absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground",
            "flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity",
            "hover:bg-destructive/90 cursor-pointer"
          )}
        >
          ×
        </span>
      )}
    </button>
  );
}

export const ContactFormSection = ({ config, onConfigChange }: ContactFormSectionProps) => {
  const [activeStep, setActiveStep] = useState(1);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Ensure formSteps exists with at least one step
  const formSteps = config.formSteps?.length ? config.formSteps : [{ id: 'step-1' }];
  const currentStepConfig = formSteps[activeStep - 1];
  
  // Filter fields for current step (multi-step is always enabled)
  const currentStepFields = config.customFields.filter(f => (f.step || 1) === activeStep);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Only reorder within current step's fields
      const currentFieldIds = currentStepFields.map(f => f.id);
      const oldIndex = currentFieldIds.indexOf(active.id as string);
      const newIndex = currentFieldIds.indexOf(over.id as string);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedStepFields = arrayMove(currentStepFields, oldIndex, newIndex);
        
        // Rebuild full fields array with reordered step fields
        const otherFields = config.customFields.filter(f => (f.step || 1) !== activeStep);
        onConfigChange({ customFields: [...otherFields, ...reorderedStepFields] });
      }
    }
  };

  const addCustomField = () => {
    const newField: CustomField = {
      id: `field-${Date.now()}`,
      label: '',
      fieldType: 'text',
      required: false,
      placeholder: '',
      step: activeStep,
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

  const addStep = () => {
    const newStep: FormStep = {
      id: `step-${Date.now()}`,
      title: '',
      subtitle: '',
    };
    const newSteps = [...formSteps, newStep];
    onConfigChange({ formSteps: newSteps });
    setActiveStep(newSteps.length);
  };

  const removeStep = (stepIndex: number) => {
    if (formSteps.length <= 1) return;
    
    const stepNumber = stepIndex + 1;
    
    // Remove the step
    const newSteps = formSteps.filter((_, i) => i !== stepIndex);
    
    // Update fields: reassign fields from deleted step to previous step
    const updatedFields = config.customFields.map(f => {
      const fieldStep = f.step || 1;
      if (fieldStep === stepNumber) {
        // Move to previous step (or step 1 if deleting step 1)
        return { ...f, step: Math.max(1, stepNumber - 1) };
      } else if (fieldStep > stepNumber) {
        // Decrement step numbers for fields after deleted step
        return { ...f, step: fieldStep - 1 };
      }
      return f;
    });
    
    onConfigChange({ 
      formSteps: newSteps,
      customFields: updatedFields,
    });
    
    // Adjust active step if needed
    if (activeStep > newSteps.length) {
      setActiveStep(newSteps.length);
    }
  };

  const updateStepConfig = (updates: Partial<FormStep>) => {
    const newSteps = formSteps.map((step, i) => 
      i === activeStep - 1 ? { ...step, ...updates } : step
    );
    onConfigChange({ formSteps: newSteps });
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
          {/* Step Tabs - always visible */}
          <div className="flex items-center gap-2 flex-wrap">
              {formSteps.map((step, index) => (
                <StepTab
                  key={step.id}
                  step={step}
                  stepNumber={index + 1}
                  isActive={activeStep === index + 1}
                  onClick={() => setActiveStep(index + 1)}
                  onRemove={() => removeStep(index)}
                  canRemove={formSteps.length > 1}
                />
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addStep}
                className="h-8"
              >
                <Plus size={14} className="mr-1" aria-hidden="true" />
                Add Step
              </Button>
          </div>

          {/* Step Title & Subtitle */}
          <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Step {activeStep} Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`step-${activeStep}-title`} className="text-xs">
                    Step Title {activeStep === 1 && <span className="text-muted-foreground">(defaults to form title)</span>}
                  </Label>
                  <Input
                    id={`step-${activeStep}-title`}
                    value={currentStepConfig?.title || ''}
                    onChange={(e) => updateStepConfig({ title: e.target.value })}
                    placeholder={activeStep === 1 ? config.contactFormTitle : `Step ${activeStep} Title`}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`step-${activeStep}-subtitle`} className="text-xs">
                    Step Subtitle
                  </Label>
                  <Input
                    id={`step-${activeStep}-subtitle`}
                    value={currentStepConfig?.subtitle || ''}
                    onChange={(e) => updateStepConfig({ subtitle: e.target.value })}
                    placeholder={activeStep === 1 ? config.contactFormSubtitle : 'Optional description'}
                    className="h-8 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

          {/* Custom Fields Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Step {activeStep} Fields
                </CardTitle>
                {activeStep === 1 && (
                  <span className="text-xs text-muted-foreground">First, Last, Email are default</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {currentStepFields.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {activeStep === 1 
                    ? 'No custom fields yet (First, Last, Email are always shown)'
                    : 'No fields in this step yet'
                  }
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={currentStepFields.map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div>
                      {currentStepFields.map((field) => (
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
                Add Field {config.enableMultiStepForm ? `to Step ${activeStep}` : ''}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
