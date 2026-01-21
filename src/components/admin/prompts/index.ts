/**
 * Admin Prompts Components Barrel Export
 * 
 * @module components/admin/prompts
 */

// New 3-column layout components
export { AdminPromptSectionMenu, type PromptSection } from './AdminPromptSectionMenu';
export { AdminPromptPreviewPanel } from './AdminPromptPreviewPanel';
export { AdminSectionHeader } from './AdminSectionHeader';

// Section components
export { IdentitySection } from './sections/IdentitySection';
export { FormattingSection } from './sections/FormattingSection';
export { SecuritySection } from './sections/SecuritySection';
export { LanguageSection } from './sections/LanguageSection';

// Legacy exports (kept for backward compatibility)
export { FullPromptPreview } from './FullPromptPreview';
export { PromptTestChat } from './PromptTestChat';
export { PromptPreview } from './PromptPreview';
export { PromptVersionHistory } from './PromptVersionHistory';
