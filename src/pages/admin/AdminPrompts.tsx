/**
 * Admin Prompts Page
 * 
 * Configure all system prompt sections for Ari.
 * Structured editor with tabs for Editor, Preview, and Test.
 * 
 * @module pages/admin/AdminPrompts
 */

import { useMemo, useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { FileCode01 } from '@untitledui/icons';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PromptSectionEditor } from '@/components/admin/prompts/PromptSectionEditor';
import { FullPromptPreview } from '@/components/admin/prompts/FullPromptPreview';
import { SecurityGuardrailsCard } from '@/components/admin/prompts/SecurityGuardrailsCard';
import { PromptTestChat } from '@/components/admin/prompts/PromptTestChat';
import { usePromptSections } from '@/hooks/admin/usePromptSections';
import { useTopBar, TopBarPageContext } from '@/components/layout/TopBar';
import { springs } from '@/lib/motion-variants';
import {
  DEFAULT_IDENTITY_PROMPT,
  DEFAULT_FORMATTING_RULES,
  DEFAULT_SECURITY_GUARDRAILS,
  DEFAULT_LANGUAGE_INSTRUCTION,
} from '@/lib/prompt-defaults';

/**
 * System prompt configuration page for Super Admin.
 */
export function AdminPrompts() {
  const prefersReducedMotion = useReducedMotion();
  
  // Configure top bar for this page
  const topBarConfig = useMemo(() => ({
    left: <TopBarPageContext icon={FileCode01} title="System Prompt Configuration" />,
  }), []);
  useTopBar(topBarConfig);

  const { sections, versions, loading, updateSection } = usePromptSections();

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

  const handleGuardrailsChange = useCallback(async (config: Record<string, boolean>) => {
    await updateSection('guardrailsConfig', config);
  }, [updateSection]);

  return (
    <motion.div
      className="p-6"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.smooth}
    >
      <Tabs defaultValue="editor" className="space-y-6">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
        </TabsList>

        {/* Editor Tab */}
        <TabsContent value="editor" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Left Column - Main Sections */}
            <div className="lg:col-span-2 space-y-4">
              <PromptSectionEditor
                title="Identity & Role"
                description="The foundational prompt that defines who Ari is and how it behaves"
                value={sections.identity}
                defaultValue={DEFAULT_IDENTITY_PROMPT}
                onSave={handleIdentitySave}
                loading={loading}
                version={versions.identity?.version}
                lastUpdated={versions.identity?.updatedAt}
                minHeight="180px"
                placeholder="You are Ari, a helpful AI assistant..."
                defaultExpanded
              />

              <PromptSectionEditor
                title="Response Formatting Rules"
                description="Controls message chunking, conciseness, and link formatting"
                value={sections.formatting}
                defaultValue={DEFAULT_FORMATTING_RULES}
                onSave={handleFormattingSave}
                loading={loading}
                version={versions.formatting?.version}
                lastUpdated={versions.formatting?.updatedAt}
                minHeight="250px"
                placeholder="RESPONSE FORMATTING (CRITICAL)..."
              />

              <PromptSectionEditor
                title="Security Guardrails"
                description="Rules to prevent prompt injection, PII exposure, and misuse"
                value={sections.security}
                defaultValue={DEFAULT_SECURITY_GUARDRAILS}
                onSave={handleSecuritySave}
                loading={loading}
                version={versions.security?.version}
                lastUpdated={versions.security?.updatedAt}
                minHeight="200px"
                placeholder="SECURITY RULES (ABSOLUTE - NEVER VIOLATE)..."
              />

              <PromptSectionEditor
                title="Language Instruction"
                description="How Ari handles multilingual conversations"
                value={sections.language}
                defaultValue={DEFAULT_LANGUAGE_INSTRUCTION}
                onSave={handleLanguageSave}
                loading={loading}
                version={versions.language?.version}
                lastUpdated={versions.language?.updatedAt}
                minHeight="80px"
                placeholder="LANGUAGE: Always respond in the same language..."
              />
            </div>

            {/* Right Column - Quick Settings */}
            <div className="space-y-4">
              <SecurityGuardrailsCard
                config={sections.guardrailsConfig}
                onChange={handleGuardrailsChange}
                loading={loading}
              />
            </div>
          </div>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <FullPromptPreview
            identityPrompt={sections.identity}
            formattingRules={sections.formatting}
            securityGuardrails={sections.security}
            languageInstruction={sections.language}
            loading={loading}
          />
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test">
          <PromptTestChat baselinePrompt={sections.identity} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
