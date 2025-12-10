import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleSettingRow } from '@/components/ui/toggle-setting-row';
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
            <div className="flex items-center gap-2">
              <Input
                id="gradient-start"
                type="color"
                value={config.gradientStartColor}
                onChange={(e) => onConfigChange({ gradientStartColor: e.target.value })}
                className="w-16 h-9 cursor-pointer"
              />
              <Input
                value={config.gradientStartColor}
                onChange={(e) => onConfigChange({ gradientStartColor: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gradient-end" className="text-sm">Secondary Brand Color</Label>
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
        </div>
      )}
    </div>
  );
};
