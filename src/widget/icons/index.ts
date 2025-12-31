/**
 * Widget Icons - Central Export
 * 
 * Unified export point for all widget icons.
 * Re-exports from specialized icon modules for clean imports.
 * 
 * @module widget/icons
 */

// Re-export all UntitledUI icons (tree-shaken individual imports)
export * from './untitled-ui';

// Re-export custom widget star icon
export { WidgetStarIcon } from './WidgetStarIcon';

// Re-export navigation icons with fill-on-hover animation
export { HomeNavIcon, ChatNavIcon, HelpNavIcon, NewsNavIcon } from './NavIcons';
