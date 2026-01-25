/**
 * Prompt Import/Export Utilities
 * 
 * Functions for exporting and importing prompt configurations as JSON.
 * 
 * @module lib/prompt-import-export
 */

import { z } from 'zod';

/** Schema version for future compatibility */
export const PROMPT_EXPORT_VERSION = 1;

/**
 * Schema for validating imported prompt configuration.
 */
export const promptExportSchema = z.object({
  version: z.number().min(1),
  exportedAt: z.string(),
  sections: z.object({
    identity: z.string().optional(),
    formatting: z.string().optional(),
    security: z.string().optional(),
    language: z.string().optional(),
  }),
  guardrailsConfig: z.object({
    enabled: z.boolean(),
    block_pii: z.boolean(),
    block_prompt_injection: z.boolean(),
  }).optional(),
});

export type PromptExportData = z.infer<typeof promptExportSchema>;

/**
 * Export prompt sections to a downloadable JSON file.
 */
export function exportPromptConfig(sections: {
  identity: string;
  formatting: string;
  security: string;
  language: string;
  guardrailsConfig?: { enabled: boolean; block_pii: boolean; block_prompt_injection: boolean };
}): void {
  const exportData: PromptExportData = {
    version: PROMPT_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    sections: {
      identity: sections.identity,
      formatting: sections.formatting,
      security: sections.security,
      language: sections.language,
    },
    guardrailsConfig: sections.guardrailsConfig,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `prompt-config-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate an imported prompt configuration file.
 */
export async function parseImportFile(file: File): Promise<{ 
  valid: boolean; 
  data?: PromptExportData; 
  error?: string;
}> {
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    
    const result = promptExportSchema.safeParse(json);
    
    if (!result.success) {
      return { 
        valid: false, 
        error: `Invalid format: ${result.error.errors[0]?.message || 'Unknown validation error'}` 
      };
    }

    // Check version compatibility
    if (result.data.version > PROMPT_EXPORT_VERSION) {
      return { 
        valid: false, 
        error: `Unsupported version ${result.data.version}. Please update Pilot to import this file.` 
      };
    }

    return { valid: true, data: result.data };
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return { valid: false, error: 'Invalid JSON file' };
    }
    return { valid: false, error: 'Failed to read file' };
  }
}
