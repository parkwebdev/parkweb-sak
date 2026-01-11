/**
 * Admin Knowledge Page
 * 
 * Edit platform Help Articles shown in the Knowledge Base.
 * WYSIWYG editor for article content.
 * 
 * @module pages/admin/AdminKnowledge
 */

import { BookOpen01 } from '@untitledui/icons';

/**
 * Help articles editor page for Super Admin.
 */
export function AdminKnowledge() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold text-foreground">Help Articles</h1>
        <p className="text-sm text-muted-foreground">
          Edit platform documentation and help content
        </p>
      </div>

      {/* Placeholder */}
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mx-auto mb-4">
          <BookOpen01 size={24} className="text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Knowledge base editor components will be implemented in Phase 4.
        </p>
      </div>
    </div>
  );
}
