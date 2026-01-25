/**
 * Admin Prompts Page
 * 
 * Configure all system prompt sections for Ari.
 * 3-column layout: Section Menu, Content Area, Preview Panel.
 * 
 * @module pages/admin/AdminPrompts
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { FileCode01 } from '@untitledui/icons';
import { AdminPromptSectionMenu, type PromptSection } from '@/components/admin/prompts/AdminPromptSectionMenu';
import { AdminPromptPreviewPanel } from '@/components/admin/prompts/AdminPromptPreviewPanel';
import { IdentitySection } from '@/components/admin/prompts/sections/IdentitySection';
import { FormattingSection } from '@/components/admin/prompts/sections/FormattingSection';
import { SecuritySection } from '@/components/admin/prompts/sections/SecuritySection';
import { LanguageSection } from '@/components/admin/prompts/sections/LanguageSection';
import { AdminPermissionGuard } from '@/components/admin/AdminPermissionGuard';
import { usePromptSections } from '@/hooks/admin/usePromptSections';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import { springs } from '@/lib/motion-variants';

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
  const [activeSection, setActiveSection] = useState<PromptSection>('identity');

  const { sections, versions, loading, updateSection } = usePromptSections();

  // Get current section version for TopBar badge
  const currentVersion = versions[activeSection]?.version;

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
  }), [activeSection, currentVersion]);
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

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'identity':
        return (
          <IdentitySection
            value={sections.identity}
            onSave={handleIdentitySave}
            loading={loading}
            version={versions.identity?.version}
            lastUpdated={versions.identity?.updatedAt}
          />
        );
      case 'formatting':
        return (
          <FormattingSection
            value={sections.formatting}
            onSave={handleFormattingSave}
            loading={loading}
            version={versions.formatting?.version}
            lastUpdated={versions.formatting?.updatedAt}
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
            version={versions.security?.version}
            lastUpdated={versions.security?.updatedAt}
          />
        );
      case 'language':
        return (
          <LanguageSection
            value={sections.language}
            onSave={handleLanguageSave}
            loading={loading}
            version={versions.language?.version}
            lastUpdated={versions.language?.updatedAt}
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
          onSectionChange={setActiveSection}
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
        <AdminPromptPreviewPanel />
      </div>
    </AdminPermissionGuard>
  );
}
