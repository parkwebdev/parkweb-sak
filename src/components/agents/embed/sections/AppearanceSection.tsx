import { Label } from '@/components/ui/label';
import { ToggleSettingRow } from '@/components/ui/toggle-setting-row';
import { ColorPicker } from '@/components/ui/color-picker';
import type { EmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';

interface AppearanceSectionProps {
  config: EmbeddedChatConfig;
  onConfigChange: (updates: Partial<EmbeddedChatConfig>) => void;
}

export const AppearanceSection = ({ config, onConfigChange }: AppearanceSectionProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="primary-color" className="text-sm">Text/Button Color</Label>
        <ColorPicker
          id="primary-color"
          value={config.primaryColor}
          onChange={(color) => onConfigChange({ primaryColor: color })}
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
        <div className="space-y-4 pl-4 border-l-2">
          <div className="space-y-2">
            <Label htmlFor="gradient-start" className="text-sm">Primary Brand Color</Label>
            <ColorPicker
              id="gradient-start"
              value={config.gradientStartColor}
              onChange={(color) => onConfigChange({ gradientStartColor: color })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gradient-end" className="text-sm">Secondary Brand Color</Label>
            <ColorPicker
              id="gradient-end"
              value={config.gradientEndColor}
              onChange={(color) => onConfigChange({ gradientEndColor: color })}
            />
          </div>
        </div>
      )}
    </div>
  );
};
