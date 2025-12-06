/**
 * useWidgetConfig Hook
 * 
 * Handles config loading and state management for the widget.
 */

import { useState, useEffect } from 'react';
import { fetchWidgetConfig, type WidgetConfig } from '../api';
import type { ChatWidgetProps } from '../types';

interface UseWidgetConfigResult {
  config: WidgetConfig | null;
  loading: boolean;
  isContentLoading: boolean;
  isSimpleConfig: boolean;
  parentHandlesConfig: boolean;
  agentId: string;
}

export function useWidgetConfig(
  configProp: ChatWidgetProps['config'],
  isLoadingProp: boolean = false,
  previewMode: boolean = false
): UseWidgetConfigResult {
  // If isLoading prop is provided, parent is handling config fetching (Intercom-style)
  const parentHandlesConfig = isLoadingProp !== undefined && 'greeting' in configProp;
  const isSimpleConfig = !parentHandlesConfig && 'agentId' in configProp && !('greeting' in configProp);
  
  const [config, setConfig] = useState<WidgetConfig | null>(
    isSimpleConfig ? null : (configProp as WidgetConfig)
  );
  const [loading, setLoading] = useState(isSimpleConfig);
  
  // Use the loading state from parent if provided (Intercom-style instant loading)
  const isContentLoading = parentHandlesConfig ? isLoadingProp : loading;
  
  const agentId = isSimpleConfig ? (configProp as any).agentId : (configProp as WidgetConfig).agentId;

  // Load config on mount if simple config
  useEffect(() => {
    if (isSimpleConfig) {
      fetchWidgetConfig((configProp as any).agentId)
        .then(cfg => {
          setConfig(cfg);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load config:', err);
          setLoading(false);
        });
    }
  }, []);

  // Sync config state when configProp changes (for preview mode OR parent handles config)
  useEffect(() => {
    if (!isSimpleConfig && (previewMode || parentHandlesConfig)) {
      setConfig(configProp as WidgetConfig);
    }
  }, [configProp, isSimpleConfig, previewMode, parentHandlesConfig]);

  return {
    config,
    loading,
    isContentLoading,
    isSimpleConfig,
    parentHandlesConfig,
    agentId,
  };
}
