/**
 * useWidgetConfig Hook
 * 
 * Manages widget configuration loading, state management, and real-time updates.
 * Supports both simple config (agentId only) and full config (parent-provided).
 * 
 * @module widget/hooks/useWidgetConfig
 * 
 * @example
 * ```tsx
 * const { config, loading, isContentLoading } = useWidgetConfig(
 *   { agentId: 'abc-123' },
 *   false,
 *   false
 * );
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchWidgetConfig, type WidgetConfig } from '../api';
import type { ChatWidgetProps, SimpleWidgetConfig } from '../types';
import { useRealtimeConfig } from './useRealtimeConfig';

/** Return type for useWidgetConfig hook */
interface UseWidgetConfigResult {
  /** Loaded widget configuration or null if still loading */
  config: WidgetConfig | null;
  /** Whether initial config fetch is in progress */
  loading: boolean;
  /** Whether content is still loading (accounts for parent handling) */
  isContentLoading: boolean;
  /** Whether a simple config (agentId only) was provided */
  isSimpleConfig: boolean;
  /** Whether parent window handles config fetching */
  parentHandlesConfig: boolean;
  /** Agent ID extracted from config */
  agentId: string;
}

/**
 * Hook for managing widget configuration state and real-time updates.
 * 
 * @param configProp - Initial config prop (simple or full config)
 * @param isLoadingProp - Loading state from parent (for iframe mode)
 * @param previewMode - Whether widget is in preview/editor mode
 * @returns Configuration state and loading indicators
 */
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
  
  const agentId = isSimpleConfig ? (configProp as SimpleWidgetConfig).agentId : (configProp as WidgetConfig).agentId;

  // Handle real-time config updates
  const handleConfigUpdate = useCallback((newConfig: WidgetConfig) => {
    setConfig(newConfig);
  }, []);

  // Subscribe to real-time config changes (only when not in preview mode)
  useRealtimeConfig({
    agentId,
    enabled: !previewMode && !!agentId,
    onConfigUpdate: handleConfigUpdate,
  });

  // Load config on mount if simple config
  useEffect(() => {
    if (isSimpleConfig) {
      fetchWidgetConfig((configProp as SimpleWidgetConfig).agentId)
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
