/**
 * Admin Prompts Page
 * 
 * Configure baseline prompt modifier for all agents.
 * Includes version history and security guardrails.
 * 
 * @module pages/admin/AdminPrompts
 */

import { FileCode01 } from '@untitledui/icons';

/**
 * Baseline prompt configuration page for Super Admin.
 */
export function AdminPrompts() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold text-foreground">Baseline Prompt</h1>
        <p className="text-sm text-muted-foreground">
          Configure the global prompt modifier applied to all agents
        </p>
      </div>

      {/* Placeholder */}
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
          <FileCode01 size={24} className="text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Prompt editor components will be implemented in Phase 4.
        </p>
      </div>
    </div>
  );
}
