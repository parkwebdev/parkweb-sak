import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ToggleSettingRow } from '@/components/ui/toggle-setting-row';
import type { EmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';

interface ContentSectionProps {
  config: EmbeddedChatConfig;
  onConfigChange: (updates: Partial<EmbeddedChatConfig>) => void;
}

export const ContentSection = ({ config, onConfigChange }: ContentSectionProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="agent-name" className="text-sm">Agent Name</Label>
        <Input
          id="agent-name"
          value={config.agentName}
          onChange={(e) => onConfigChange({ agentName: e.target.value })}
          placeholder="AI Assistant"
          className="text-sm"
        />
      </div>

      <div className="grid grid-cols-[1fr_80px] gap-4">
        <div className="space-y-2">
          <Label htmlFor="placeholder" className="text-sm">Input Placeholder</Label>
          <Input
            id="placeholder"
            value={config.placeholder}
            onChange={(e) => onConfigChange({ placeholder: e.target.value })}
            placeholder="Type your message..."
            className="text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="welcome-emoji" className="text-sm">Emoji</Label>
          <Input
            id="welcome-emoji"
            value={config.welcomeEmoji}
            onChange={(e) => onConfigChange({ welcomeEmoji: e.target.value })}
            placeholder="👋"
            maxLength={2}
            className="text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
    </div>
  );
};
