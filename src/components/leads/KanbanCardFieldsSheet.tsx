/**
 * @fileoverview Sheet for toggling Kanban card field visibility.
 * Allows users to customize which fields are displayed on lead cards.
 */

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { 
  getFieldsByGroup, 
  getDefaultVisibleFields,
  FIELD_GROUP_LABELS,
  CARD_FIELDS,
  type CardFieldKey,
  type FieldGroup 
} from "./KanbanCardFields";

interface KanbanCardFieldsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visibleFields: Set<CardFieldKey>;
  onToggleField: (field: CardFieldKey) => void;
  onSetFields: (fields: Set<CardFieldKey>) => void;
}

const GROUP_ORDER: FieldGroup[] = ['contact', 'session', 'organization', 'timestamps', 'notes'];

export function KanbanCardFieldsSheet({
  open,
  onOpenChange,
  visibleFields,
  onToggleField,
  onSetFields,
}: KanbanCardFieldsSheetProps) {
  const fieldsByGroup = getFieldsByGroup();
  
  const handleSelectAll = () => {
    onSetFields(new Set(CARD_FIELDS.map(f => f.key)));
  };
  
  const handleResetToDefaults = () => {
    onSetFields(getDefaultVisibleFields());
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[340px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Card Fields</SheetTitle>
          <SheetDescription>
            Choose which fields to display on Kanban cards
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6 space-y-6">
          {GROUP_ORDER.map((groupKey, groupIndex) => {
            const fields = fieldsByGroup[groupKey];
            if (!fields?.length) return null;
            
            return (
              <div key={groupKey}>
                {groupIndex > 0 && <Separator className="mb-6" />}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {FIELD_GROUP_LABELS[groupKey]}
                  </h4>
                  <div className="space-y-2">
                    {fields.map((field) => {
                      const Icon = field.icon;
                      const isChecked = visibleFields.has(field.key);
                      
                      return (
                        <label
                          key={field.key}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => onToggleField(field.key)}
                          />
                          <Icon size={16} className="text-muted-foreground" />
                          <span className="text-sm">{field.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <SheetFooter className="gap-2 sm:gap-2">
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetToDefaults}>
            Reset to Defaults
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
