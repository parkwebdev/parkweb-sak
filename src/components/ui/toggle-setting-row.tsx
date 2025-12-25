/**
 * ToggleSettingRow Component
 * 
 * A settings row with label, optional description, and toggle switch.
 * Used for binary on/off settings with optional saved state indicator.
 * 
 * @module components/ui/toggle-setting-row
 * 
 * @example
 * ```tsx
 * <ToggleSettingRow
 *   id="notifications"
 *   label="Enable notifications"
 *   description="Receive alerts for new messages"
 *   checked={enabled}
 *   onCheckedChange={setEnabled}
 *   showSaved={justSaved}
 * />
 * ```
 */
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SavedIndicator } from '@/components/settings/SavedIndicator';

interface ToggleSettingRowProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  showSaved?: boolean;
  disabled?: boolean;
}

export const ToggleSettingRow = ({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  showSaved,
  disabled,
}: ToggleSettingRowProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5 flex-1">
        <div className="flex items-center gap-2">
          <Label htmlFor={id} className="text-sm font-medium">
            {label}
          </Label>
          {showSaved !== undefined && <SavedIndicator show={showSaved} />}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
};
