/**
 * AriPerformanceSection
 * 
 * Widget performance settings including loading mode and caching options.
 */

import { useEmbeddedChatConfig } from '@/hooks/useEmbeddedChatConfig';
import { AriSectionHeader } from './AriSectionHeader';
import { LoadingState } from '@/components/ui/loading-state';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoCircle } from '@untitledui/icons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AriPerformanceSectionProps {
  agentId: string;
}

type LoadingMode = 'immediate' | 'idle' | 'interaction' | 'click';

interface LoadingModeOption {
  value: LoadingMode;
  label: string;
  description: string;
  initialLoad: string;
  openDelay: string;
  recommended?: boolean;
}

const LOADING_MODES: LoadingModeOption[] = [
  {
    value: 'immediate',
    label: 'Immediate',
    description: 'Widget loads as soon as the page loads. Fastest open time.',
    initialLoad: '~280KB',
    openDelay: 'Instant',
    recommended: true,
  },
  {
    value: 'idle',
    label: 'When Idle',
    description: 'Widget loads when the browser is idle. Good balance of performance.',
    initialLoad: '~280KB (deferred)',
    openDelay: '~100ms',
  },
  {
    value: 'interaction',
    label: 'On First Interaction',
    description: 'Widget loads on first scroll, click, or touch. Minimal initial impact.',
    initialLoad: '0KB initial',
    openDelay: '~300ms',
  },
  {
    value: 'click',
    label: 'On Button Click',
    description: 'Widget only loads when user clicks the chat button. Smallest footprint.',
    initialLoad: '0KB initial',
    openDelay: '~500ms',
  },
];

export const AriPerformanceSection: React.FC<AriPerformanceSectionProps> = ({ agentId }) => {
  const { config, loading, saveConfig } = useEmbeddedChatConfig(agentId);

  if (loading) {
    return <LoadingState text="Loading performance settings..." />;
  }

  const currentLoadingMode = (config as { loadingMode?: LoadingMode }).loadingMode || 'immediate';
  const enablePreload = (config as { enablePreload?: boolean }).enablePreload ?? true;

  const handleLoadingModeChange = (value: LoadingMode) => {
    saveConfig({ loadingMode: value } as Partial<typeof config>);
  };

  const handlePreloadChange = (checked: boolean) => {
    saveConfig({ enablePreload: checked } as Partial<typeof config>);
  };

  return (
    <div className="space-y-6">
      <AriSectionHeader
        title="Performance"
        description="Optimize how the widget loads on your website"
      />

      {/* Loading Mode */}
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Loading Mode</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Choose when the widget should load on your website
          </p>
        </div>

        <RadioGroup
          value={currentLoadingMode}
          onValueChange={handleLoadingModeChange}
          className="space-y-3"
        >
          {LOADING_MODES.map((mode) => (
            <label
              key={mode.value}
              className={cn(
                'flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors',
                currentLoadingMode === mode.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <RadioGroupItem value={mode.value} className="mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{mode.label}</span>
                  {mode.recommended && (
                    <Badge variant="secondary" className="text-2xs">
                      Recommended
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{mode.description}</p>
                <div className="flex items-center gap-4 pt-1">
                  <span className="text-2xs text-muted-foreground">
                    Initial: <span className="font-medium text-foreground">{mode.initialLoad}</span>
                  </span>
                  <span className="text-2xs text-muted-foreground">
                    Open delay: <span className="font-medium text-foreground">{mode.openDelay}</span>
                  </span>
                </div>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Preload Resources Toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg border">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Preload Resources</Label>
          <p className="text-xs text-muted-foreground">
            Add browser hints to fetch widget assets early
          </p>
        </div>
        <Switch
          checked={enablePreload}
          onCheckedChange={handlePreloadChange}
          disabled={currentLoadingMode === 'click'}
        />
      </div>

      {/* Info Alert */}
      <Alert>
        <InfoCircle size={16} className="mt-0.5" />
        <AlertDescription className="text-xs">
          <strong>How it works:</strong> The widget bundle (~280KB gzipped) includes React and Supabase 
          for real-time messaging. Deferred loading modes reduce initial page load impact but add 
          a small delay when opening the chat. Most websites benefit from the "Immediate" mode for 
          instant chat access.
        </AlertDescription>
      </Alert>
    </div>
  );
};
