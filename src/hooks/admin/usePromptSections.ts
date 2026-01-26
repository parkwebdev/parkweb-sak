/**
 * Hook for managing all prompt configuration sections
 * 
 * @module hooks/admin/usePromptSections
 */

import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';
import {
  DEFAULT_IDENTITY_PROMPT,
  DEFAULT_FORMATTING_RULES,
  DEFAULT_SECURITY_GUARDRAILS,
  DEFAULT_LANGUAGE_INSTRUCTION,
  PROMPT_CONFIG_KEYS,
} from '@/lib/prompt-defaults';

export interface PromptSections {
  identity: string;
  formatting: string;
  security: string;
  language: string;
  guardrailsConfig: {
    enabled: boolean;
    block_pii: boolean;
    block_prompt_injection: boolean;
  };
}

interface PromptSectionVersions {
  identity?: { version: number; updatedAt: string };
  formatting?: { version: number; updatedAt: string };
  security?: { version: number; updatedAt: string };
  language?: { version: number; updatedAt: string };
}

interface UsePromptSectionsResult {
  sections: PromptSections;
  versions: PromptSectionVersions;
  loading: boolean;
  error: Error | null;
  updateSection: (key: keyof PromptSections, value: string | object) => Promise<void>;
  isUpdating: boolean;
}

/** Extract string value from various stored formats */
function extractValue(data: unknown, fallback: string): string {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if ('prompt' in obj && typeof obj.prompt === 'string') return obj.prompt;
    if ('rules' in obj && typeof obj.rules === 'string') return obj.rules;
    if ('text' in obj && typeof obj.text === 'string') return obj.text;
    if ('instruction' in obj && typeof obj.instruction === 'string') return obj.instruction;
  }
  return fallback;
}

export function usePromptSections(): UsePromptSectionsResult {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.config.all(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_config')
        .select('key, value, version, updated_at')
        .in('key', Object.values(PROMPT_CONFIG_KEYS));

      if (error) throw error;

      const configMap = new Map(data?.map(row => [row.key, row]) || []);

      const sections: PromptSections = {
        identity: extractValue(
          configMap.get(PROMPT_CONFIG_KEYS.identity)?.value,
          DEFAULT_IDENTITY_PROMPT
        ),
        formatting: extractValue(
          configMap.get(PROMPT_CONFIG_KEYS.formatting)?.value,
          DEFAULT_FORMATTING_RULES
        ),
        security: extractValue(
          configMap.get(PROMPT_CONFIG_KEYS.security)?.value,
          DEFAULT_SECURITY_GUARDRAILS
        ),
        language: extractValue(
          configMap.get(PROMPT_CONFIG_KEYS.language)?.value,
          DEFAULT_LANGUAGE_INSTRUCTION
        ),
        guardrailsConfig: {
          enabled: true,
          block_pii: true,
          block_prompt_injection: true,
          ...(configMap.get(PROMPT_CONFIG_KEYS.guardrailsConfig)?.value as object || {}),
        },
      };

      const versions: PromptSectionVersions = {};
      
      const identityRow = configMap.get(PROMPT_CONFIG_KEYS.identity);
      if (identityRow) {
        versions.identity = { 
          version: identityRow.version || 1, 
          updatedAt: identityRow.updated_at || '' 
        };
      }
      
      const formattingRow = configMap.get(PROMPT_CONFIG_KEYS.formatting);
      if (formattingRow) {
        versions.formatting = { 
          version: formattingRow.version || 1, 
          updatedAt: formattingRow.updated_at || '' 
        };
      }
      
      const securityRow = configMap.get(PROMPT_CONFIG_KEYS.security);
      if (securityRow) {
        versions.security = { 
          version: securityRow.version || 1, 
          updatedAt: securityRow.updated_at || '' 
        };
      }
      
      const languageRow = configMap.get(PROMPT_CONFIG_KEYS.language);
      if (languageRow) {
        versions.language = { 
          version: languageRow.version || 1, 
          updatedAt: languageRow.updated_at || '' 
        };
      }

      return { sections, versions };
    },
    staleTime: 60000,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ 
      key, 
      value, 
      currentVersion 
    }: { 
      key: string; 
      value: unknown; 
      currentVersion: number;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Format value based on key
      let formattedValue: unknown;
      if (key === PROMPT_CONFIG_KEYS.identity) {
        formattedValue = { prompt: value };
      } else if (key === PROMPT_CONFIG_KEYS.formatting) {
        formattedValue = { rules: value };
      } else if (key === PROMPT_CONFIG_KEYS.security) {
        formattedValue = { text: value };
      } else if (key === PROMPT_CONFIG_KEYS.language) {
        formattedValue = { instruction: value };
      } else {
        formattedValue = value;
      }

      // Try update first
      const { data: updateData, error: updateError } = await supabase
        .from('platform_config')
        .update({
          value: formattedValue as never,
          version: currentVersion + 1,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq('key', key)
        .select()
        .single();

      // If no rows updated, insert
      if (updateError?.code === 'PGRST116' || !updateData) {
        const { error: insertError } = await supabase
          .from('platform_config')
          .insert({
            key,
            value: formattedValue as never,
            version: 1,
            updated_by: user.id,
          });

        if (insertError) throw insertError;
      } else if (updateError) {
        throw updateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.config.all() });
    },
    onError: (error: unknown) => {
      toast.error('Failed to save', {
        description: getErrorMessage(error),
      });
    },
  });

  const updateSection = useCallback(async (sectionKey: keyof PromptSections, value: string | object) => {
    const configKey = PROMPT_CONFIG_KEYS[sectionKey];
    const currentData = queryClient.getQueryData<{ sections: PromptSections; versions: PromptSectionVersions }>(
      adminQueryKeys.config.all()
    );
    const currentVersion = currentData?.versions?.[sectionKey as keyof PromptSectionVersions]?.version || 0;
    
    await updateMutation.mutateAsync({
      key: configKey,
      value,
      currentVersion,
    });
  }, [updateMutation, queryClient]);

  const defaultSections: PromptSections = {
    identity: DEFAULT_IDENTITY_PROMPT,
    formatting: DEFAULT_FORMATTING_RULES,
    security: DEFAULT_SECURITY_GUARDRAILS,
    language: DEFAULT_LANGUAGE_INSTRUCTION,
    guardrailsConfig: {
      enabled: true,
      block_pii: true,
      block_prompt_injection: true,
    },
  };

  const sections = (data as { sections: PromptSections; versions: PromptSectionVersions } | undefined)?.sections || defaultSections;
  const versions = (data as { sections: PromptSections; versions: PromptSectionVersions } | undefined)?.versions || {};

  return {
    sections,
    versions,
    loading: isLoading,
    error: error as Error | null,
    updateSection,
    isUpdating: updateMutation.isPending,
  };
}
