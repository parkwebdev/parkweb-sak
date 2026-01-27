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
import { TextInputOutline } from '@/components/icons/AdminSidebarIcons';
import { ImportExportDropdown } from '@/components/admin/prompts/ImportExportDropdown';
import { AdminPromptSectionMenu, type PromptSection } from '@/components/admin/prompts/AdminPromptSectionMenu';
import { AdminPromptPreviewPanel } from '@/components/admin/prompts/AdminPromptPreviewPanel';
import { PromptHistoryPanel } from '@/components/admin/prompts/PromptHistoryPanel';
import { ResetToDefaultButton } from '@/components/admin/prompts/ResetToDefaultButton';
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
import { 
  PROMPT_CONFIG_KEYS,
  DEFAULT_IDENTITY_PROMPT,
  DEFAULT_FORMATTING_RULES,
  DEFAULT_SECURITY_GUARDRAILS,
  DEFAULT_LANGUAGE_INSTRUCTION,
} from '@/lib/prompt-defaults';
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
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savePendingRef = useRef<(() => Promise<void>) | null>(null);
  const resetFunctionRef = useRef<(() => void) | null>(null);

  const { sections, versions, loading, updateSection } = usePromptSections();

  // Preview panel collapse state with localStorage persistence
  const [previewCollapsed, setPreviewCollapsed] = useState(() => {
    const saved = localStorage.getItem('admin_prompts_preview_collapsed');
    return saved === 'true';
  });

  // Persist preview collapse state to localStorage
  useEffect(() => {
    localStorage.setItem('admin_prompts_preview_collapsed', String(previewCollapsed));
  }, [previewCollapsed]);

  const handleTogglePreview = useCallback(() => {
    setPreviewCollapsed(prev => !prev);
  }, []);

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

  // Check if current section matches default
  const isDefault = useMemo(() => {
    switch (activeSection) {
      case 'identity': return sections.identity === DEFAULT_IDENTITY_PROMPT;
      case 'formatting': return sections.formatting === DEFAULT_FORMATTING_RULES;
      case 'security': return sections.security === DEFAULT_SECURITY_GUARDRAILS;
      case 'language': return sections.language === DEFAULT_LANGUAGE_INSTRUCTION;
      default: return true;
    }
  }, [activeSection, sections]);

  // Handle save from TopBar
  const handleTopBarSave = useCallback(async () => {
    if (savePendingRef.current) {
      setIsSaving(true);
      try {
        await savePendingRef.current();
        setHasUnsavedChanges(false);
        toast.success('Saved');
      } catch (error: unknown) {
        toast.error('Failed to save', { description: getErrorMessage(error) });
      } finally {
        setIsSaving(false);
      }
    }
  }, []);

  // Handle reset from TopBar
  const handleTopBarReset = useCallback(() => {
    resetFunctionRef.current?.();
  }, []);

  // Configure top bar for this page with dynamic subtitle and version badge
  const topBarConfig = useMemo(() => ({
    left: (
      <TopBarPageContext 
        icon={TextInputOutline} 
        title="Prompts" 
        subtitle={SECTION_LABELS[activeSection]}
        badge={currentVersion !== undefined ? (
          <Badge variant="secondary" size="sm" className="hidden sm:inline-flex">v{currentVersion}</Badge>
        ) : undefined}
      />
    ),
    right: (
      <div className="flex items-center gap-2">
        <ResetToDefaultButton
          onReset={handleTopBarReset}
          disabled={isDefault && !hasUnsavedChanges}
          sectionName={SECTION_LABELS[activeSection]}
        />
        <PromptHistoryPanel
          section={activeSection}
          sectionLabel={SECTION_LABELS[activeSection]}
          currentValue={currentSectionValue}
          onRestore={handleHistoryRestore}
        />
        <ImportExportDropdown
          onExport={handleExport}
          onImport={() => fileInputRef.current?.click()}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
        <Button
          size="sm"
          onClick={handleTopBarSave}
          disabled={!hasUnsavedChanges || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    ),
  }), [activeSection, currentVersion, currentSectionValue, handleHistoryRestore, handleExport, handleImport, handleTopBarReset, isDefault, hasUnsavedChanges, handleTopBarSave, isSaving]);
  useTopBar(topBarConfig, `prompts-${activeSection}-${currentVersion}-${hasUnsavedChanges}-${isSaving}`);

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
    draftValue?: string,
    resetFunction?: () => void
  ) => {
    setHasUnsavedChanges(hasChanges);
    savePendingRef.current = saveFunction;
    if (resetFunction) {
      resetFunctionRef.current = resetFunction;
    }
    
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
  const handleIdentityUnsavedChange = useCallback((hasChanges: boolean, saveFunction: () => Promise<void>, draftValue?: string, resetFunction?: () => void) => {
    handleUnsavedChange('identity', hasChanges, saveFunction, draftValue, resetFunction);
  }, [handleUnsavedChange]);

  const handleFormattingUnsavedChange = useCallback((hasChanges: boolean, saveFunction: () => Promise<void>, draftValue?: string, resetFunction?: () => void) => {
    handleUnsavedChange('formatting', hasChanges, saveFunction, draftValue, resetFunction);
  }, [handleUnsavedChange]);

  const handleSecurityUnsavedChange = useCallback((hasChanges: boolean, saveFunction: () => Promise<void>, draftValue?: string, resetFunction?: () => void) => {
    handleUnsavedChange('security', hasChanges, saveFunction, draftValue, resetFunction);
  }, [handleUnsavedChange]);

  const handleLanguageUnsavedChange = useCallback((hasChanges: boolean, saveFunction: () => Promise<void>, draftValue?: string, resetFunction?: () => void) => {
    handleUnsavedChange('language', hasChanges, saveFunction, draftValue, resetFunction);
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
          isCollapsed={previewCollapsed}
          onToggleCollapse={handleTogglePreview}
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
