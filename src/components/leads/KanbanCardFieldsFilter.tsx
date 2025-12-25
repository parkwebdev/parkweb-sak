/**
 * @fileoverview Dropdown filter for toggling Kanban card field visibility.
 * Allows users to customize which fields are displayed on lead cards.
 */

import { LayoutGrid01 } from "@untitledui/icons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  getFieldsByGroup, 
  FIELD_GROUP_LABELS, 
  type CardFieldKey,
  type FieldGroup 
} from "./KanbanCardFields";

interface KanbanCardFieldsFilterProps {
  visibleFields: Set<CardFieldKey>;
  onToggleField: (field: CardFieldKey) => void;
}

const GROUP_ORDER: FieldGroup[] = ['contact', 'session', 'organization', 'timestamps', 'notes'];

export function KanbanCardFieldsFilter({
  visibleFields,
  onToggleField,
}: KanbanCardFieldsFilterProps) {
  const fieldsByGroup = getFieldsByGroup();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LayoutGrid01 size={16} />
          <span className="hidden sm:inline">Fields</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Show on cards</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {GROUP_ORDER.map((groupKey, groupIndex) => {
          const fields = fieldsByGroup[groupKey];
          if (!fields?.length) return null;
          
          return (
            <DropdownMenuGroup key={groupKey}>
              {groupIndex > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                {FIELD_GROUP_LABELS[groupKey]}
              </DropdownMenuLabel>
              {fields.map((field) => {
                const Icon = field.icon;
                const isChecked = visibleFields.has(field.key);
                
                return (
                  <DropdownMenuItem
                    key={field.key}
                    className="gap-2 cursor-pointer"
                    onSelect={(e) => {
                      e.preventDefault();
                      onToggleField(field.key);
                    }}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => onToggleField(field.key)}
                      className="pointer-events-none"
                    />
                    <Icon size={14} className="text-muted-foreground" />
                    <span>{field.label}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
