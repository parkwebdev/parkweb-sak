/**
 * Admin Prompts Page
 * 
 * Configure all system prompt sections for Ari.
 * 3-column layout: Section Menu, Content Area, Preview Panel.
 * 
 * @module pages/admin/AdminPrompts
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileCode01, Download01, Upload01 } from '@untitledui/icons';
import { AdminPromptSectionMenu, type PromptSection } from '@/components/admin/prompts/AdminPromptSectionMenu';
import { AdminPromptPreviewPanel } from '@/components/admin/prompts/AdminPromptPreviewPanel';
import { PromptHistoryPanel } from '@/components/admin/prompts/PromptHistoryPanel';
import { UnsavedChangesDialog } from '@/components/admin/prompts/UnsavedChangesDialog';
import { IdentitySection } from '@/components/admin/prompts/sections/IdentitySection';
import { FormattingSection } from '@/components/admin/prompts/sections/FormattingSection';
import { SecuritySection } from '@/components/admin/prompts/sections/SecuritySection';
import { LanguageSection } from '@/components/admin/prompts/sections/LanguageSection';
import { AdminPermissionGuard } from '@/components/admin/AdminPermissionGuard';
import { usePromptSections } from '@/hooks/admin/usePromptSections';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import { springs } from '@/lib/motion-variants';
import { adminQueryKeys } from '@/lib/admin/admin-query-keys';
import { PROMPT_CONFIG_KEYS } from '@/lib/prompt-defaults';
import { exportPromptConfig, parseImportFile } from '@/lib/prompt-import-export';
import { toast } from 'sonner';
import { getErrorMessage } from '@/types/errors';

/** Labels for each prompt section */
const SECTION_LABELS: Record<PromptSection, string> = {
  identity: 'Identity & Role',
  formatting: 'Response Formatting',
  security: 'Security Guardrails',
  language: 'Language Instruction',
};

/**
 * System prompt configuration page for Super Admin.
 */
export function AdminPrompts() {
  const prefersReducedMotion = useReducedMotion();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<PromptSection>('identity');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingSection, setPendingSection] = useState<PromptSection | null>(null);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [isSavingForSwitch, setIsSavingForSwitch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savePendingRef = useRef<(() => Promise<void>) | null>(null);

  const { sections, versions, loading, updateSection } = usePromptSections();

  // Get current section version for TopBar badge
  const currentVersion = versions[activeSection]?.version;

  // Get current section value for history comparison
  const currentSectionValue = useMemo(() => {
    switch (activeSection) {
      case 'identity':
        return sections.identity;
      case 'formatting':
        return sections.formatting;
      case 'security':
        return sections.security;
      case 'language':
        return sections.language;
      default:
        return '';
    }
  }, [activeSection, sections]);

  // Handle restore from history - also invalidate history query
  const handleHistoryRestore = useCallback(async (value: string) => {
    await updateSection(activeSection, value);
    // Invalidate history query so it shows the new version
    queryClient.invalidateQueries({ 
      queryKey: adminQueryKeys.config.history(PROMPT_CONFIG_KEYS[activeSection]) 
    });
  }, [activeSection, updateSection, queryClient]);

  // Unsaved changes warning on page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle section change with unsaved changes check
  const handleSectionChange = useCallback((section: PromptSection) => {
    if (hasUnsavedChanges) {
      setPendingSection(section);
      setUnsavedDialogOpen(true);
    } else {
      setActiveSection(section);
    }
  }, [hasUnsavedChanges]);

  // Discard changes and switch section
  const handleDiscardChanges = useCallback(() => {
    setHasUnsavedChanges(false);
    if (pendingSection) {
      setActiveSection(pendingSection);
      setPendingSection(null);
    }
    setUnsavedDialogOpen(false);
  }, [pendingSection]);

  // Save changes and then switch section
  const handleSaveAndSwitch = useCallback(async () => {
    if (savePendingRef.current) {
      setIsSavingForSwitch(true);
      try {
        await savePendingRef.current();
        setHasUnsavedChanges(false);
        if (pendingSection) {
          setActiveSection(pendingSection);
          setPendingSection(null);
        }
        setUnsavedDialogOpen(false);
      } catch (error: unknown) {
        toast.error('Failed to save', { description: getErrorMessage(error) });
      } finally {
        setIsSavingForSwitch(false);
      }
    }
  }, [pendingSection]);

  // Export all prompts
  const handleExport = useCallback(() => {
    exportPromptConfig({
      identity: sections.identity,
      formatting: sections.formatting,
      security: sections.security,
      language: sections.language,
      guardrailsConfig: sections.guardrailsConfig,
    });
    toast.success('Prompts exported');
  }, [sections]);

  // Import prompts
  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await parseImportFile(file);
    if (!result.valid || !result.data) {
      toast.error('Import failed', { description: result.error });
      return;
    }

    // Apply imported sections
    const importedSections = result.data.sections;
    try {
      if (importedSections.identity) await updateSection('identity', importedSections.identity);
      if (importedSections.formatting) await updateSection('formatting', importedSections.formatting);
      if (importedSections.security) await updateSection('security', importedSections.security);
      if (importedSections.language) await updateSection('language', importedSections.language);
      if (result.data.guardrailsConfig) await updateSection('guardrailsConfig', result.data.guardrailsConfig);
      
      toast.success('Prompts imported', { description: `From ${new Date(result.data.exportedAt).toLocaleDateString()}` });
    } catch (error: unknown) {
      toast.error('Import failed', { description: getErrorMessage(error) });
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [updateSection]);

  // Configure top bar for this page with dynamic subtitle and version badge
  const topBarConfig = useMemo(() => ({
    left: (
      <TopBarPageContext 
        icon={FileCode01} 
        title="Prompts" 
        subtitle={SECTION_LABELS[activeSection]}
        badge={currentVersion !== undefined ? (
          <Badge variant="secondary" size="sm" className="hidden sm:inline-flex">v{currentVersion}</Badge>
        ) : undefined}
      />
    ),
    right: (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleExport}>
          <Download01 size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Export</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
          <Upload01 size={16} aria-hidden="true" />
          <span className="hidden sm:inline">Import</span>
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
        <PromptHistoryPanel
          section={activeSection}
          sectionLabel={SECTION_LABELS[activeSection]}
          currentValue={currentSectionValue}
          onRestore={handleHistoryRestore}
        />
      </div>
    ),
  }), [activeSection, currentVersion, currentSectionValue, handleHistoryRestore, handleExport, handleImport]);
  useTopBar(topBarConfig, `prompts-${activeSection}-${currentVersion}`);

  const handleIdentitySave = useCallback(async (value: string) => {
    await updateSection('identity', value);
  }, [updateSection]);

  const handleFormattingSave = useCallback(async (value: string) => {
    await updateSection('formatting', value);
  }, [updateSection]);

  const handleSecuritySave = useCallback(async (value: string) => {
    await updateSection('security', value);
  }, [updateSection]);

  const handleLanguageSave = useCallback(async (value: string) => {
    await updateSection('language', value);
  }, [updateSection]);

  const handleGuardrailsChange = useCallback(async (config: { enabled: boolean; block_pii: boolean; block_prompt_injection: boolean }) => {
    await updateSection('guardrailsConfig', config);
  }, [updateSection]);

  // Track draft (unsaved) values for all sections
  const [draftValues, setDraftValues] = useState<{
    identity?: string;
    formatting?: string;
    security?: string;
    language?: string;
  }>({});

  // Handle unsaved change notifications from sections
  const handleUnsavedChange = useCallback((
    section: PromptSection,
    hasChanges: boolean, 
    saveFunction: () => Promise<void>,
    draftValue?: string
  ) => {
    setHasUnsavedChanges(hasChanges);
    savePendingRef.current = saveFunction;
    
    // Track draft value for this section
    if (hasChanges && draftValue !== undefined) {
      setDraftValues(prev => ({ ...prev, [section]: draftValue }));
    } else if (!hasChanges) {
      setDraftValues(prev => {
        const next = { ...prev };
        delete next[section];
        return next;
      });
    }
  }, []);

  // Create section-specific unsaved change handlers
  const handleIdentityUnsavedChange = useCallback((hasChanges: boolean, saveFunction: () => Promise<void>, draftValue?: string) => {
    handleUnsavedChange('identity', hasChanges, saveFunction, draftValue);
  }, [handleUnsavedChange]);

  const handleFormattingUnsavedChange = useCallback((hasChanges: boolean, saveFunction: () => Promise<void>, draftValue?: string) => {
    handleUnsavedChange('formatting', hasChanges, saveFunction, draftValue);
  }, [handleUnsavedChange]);

  const handleSecurityUnsavedChange = useCallback((hasChanges: boolean, saveFunction: () => Promise<void>, draftValue?: string) => {
    handleUnsavedChange('security', hasChanges, saveFunction, draftValue);
  }, [handleUnsavedChange]);

  const handleLanguageUnsavedChange = useCallback((hasChanges: boolean, saveFunction: () => Promise<void>, draftValue?: string) => {
    handleUnsavedChange('language', hasChanges, saveFunction, draftValue);
  }, [handleUnsavedChange]);

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'identity':
        return (
          <IdentitySection
            value={sections.identity}
            onSave={handleIdentitySave}
            loading={loading}
            lastUpdated={versions.identity?.updatedAt}
            onUnsavedChange={handleIdentityUnsavedChange}
          />
        );
      case 'formatting':
        return (
          <FormattingSection
            value={sections.formatting}
            onSave={handleFormattingSave}
            loading={loading}
            lastUpdated={versions.formatting?.updatedAt}
            onUnsavedChange={handleFormattingUnsavedChange}
          />
        );
      case 'security':
        return (
          <SecuritySection
            value={sections.security}
            guardrailsConfig={sections.guardrailsConfig}
            onSave={handleSecuritySave}
            onGuardrailsChange={handleGuardrailsChange}
            loading={loading}
            lastUpdated={versions.security?.updatedAt}
            onUnsavedChange={handleSecurityUnsavedChange}
          />
        );
      case 'language':
        return (
          <LanguageSection
            value={sections.language}
            onSave={handleLanguageSave}
            loading={loading}
            lastUpdated={versions.language?.updatedAt}
            onUnsavedChange={handleLanguageUnsavedChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AdminPermissionGuard permission="manage_settings">
      <div className="flex-1 h-full bg-muted/30 flex min-h-0">
        {/* Left: Section Menu */}
        <AdminPromptSectionMenu
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />

        {/* Center: Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
              transition={springs.smooth}
            >
              {renderSectionContent()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Right: Test Chat Panel */}
        <AdminPromptPreviewPanel 
          draftPrompts={draftValues}
          hasDraftChanges={hasUnsavedChanges}
        />
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={unsavedDialogOpen}
        onOpenChange={setUnsavedDialogOpen}
        onDiscard={handleDiscardChanges}
        onSave={handleSaveAndSwitch}
        isSaving={isSavingForSwitch}
      />
    </AdminPermissionGuard>
  );
}
