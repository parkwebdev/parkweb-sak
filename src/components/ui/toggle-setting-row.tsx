/**
 * ToggleSettingRow Component
 * 
 * A settings row with label, optional description, and toggle switch.
 * Used for binary on/off settings with optional saving indicator.
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
 *   isSaving={isSaving}
 * />
 * ```
 */
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SavingIndicator } from '@/components/ui/saving-indicator';

interface ToggleSettingRowProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  isSaving?: boolean;
  disabled?: boolean;
}

export function ToggleSettingRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  isSaving,
  disabled,
}: ToggleSettingRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5 flex-1">
        <div className="flex items-center gap-2">
          <Label htmlFor={id} className="text-sm font-medium">
            {label}
          </Label>
          <SavingIndicator isSaving={isSaving ?? false} />
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
}
