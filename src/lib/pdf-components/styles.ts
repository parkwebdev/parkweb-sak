/**
 * PDF Design System Styles
 * 
 * StyleSheet definitions for @react-pdf/renderer aligned with ChatPad branding.
 */

import { StyleSheet } from '@react-pdf/renderer';

// ChatPad Brand Colors - Clean, professional palette
export const colors = {
  // Neutral grays (matching app design system)
  primary: '#171717',      // neutral-900 - primary text
  secondary: '#525252',    // neutral-600 - secondary text
  muted: '#a3a3a3',        // neutral-400 - muted text
  border: '#e5e5e5',       // neutral-200 - borders
  bgAlt: '#fafafa',        // neutral-50 - alternating rows
  bgMuted: '#f5f5f5',      // neutral-100 - muted backgrounds (table headers)
  
  // Base colors
  white: '#ffffff',
  
  // Status colors (keep for charts)
  success: '#10b981',      // emerald-500
  warning: '#f59e0b',      // amber-500
  danger: '#ef4444',       // red-500
  info: '#14b8a6',         // teal-500
  
  // Header - now white with dark text
  headerBg: '#ffffff',
  headerText: '#171717',
  headerSubtext: '#525252',
};

// Page dimensions (A4 in points: 595.28 x 841.89)
export const PAGE = {
  WIDTH: 595.28,
  HEIGHT: 841.89,
  MARGIN: 40,
  CONTENT_WIDTH: 595.28 - 40 * 2,
} as const;

// Spacing constants (in points)
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 24,
  XXL: 32,
};

// Typography scales
export const FONT_SIZE = {
  XS: 8,
  SM: 9,
  BASE: 10,
  MD: 11,
  LG: 14,
  XL: 18,
  XXL: 22,
  XXXL: 28,
};

// Common styles
export const styles = StyleSheet.create({
  // Page
  page: {
    flexDirection: 'column',
    backgroundColor: colors.white,
    fontFamily: 'Inter',
    fontSize: FONT_SIZE.BASE,
    color: colors.primary,
    paddingTop: PAGE.MARGIN,      // Top margin for all pages
    paddingBottom: 60,            // Space for footer
  },

  // Content area (below header)
  content: {
    paddingHorizontal: PAGE.MARGIN,
    paddingTop: SPACING.MD,
  },

  // Section container
  section: {
    marginBottom: SPACING.XL,
  },

  // Section title
  sectionTitle: {
    fontSize: FONT_SIZE.LG,
    fontWeight: 600,
    color: colors.primary,
    marginBottom: SPACING.MD,
  },

  // Flex rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  rowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Text styles
  textMuted: {
    color: colors.muted,
    fontSize: FONT_SIZE.SM,
  },

  textSecondary: {
    color: colors.secondary,
    fontSize: FONT_SIZE.BASE,
  },

  textBold: {
    fontWeight: 700,
  },

  textSemibold: {
    fontWeight: 600,
  },

  // Cards
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: SPACING.LG,
    marginBottom: SPACING.SM,
    borderWidth: 1,
    borderColor: colors.border,
  },

  cardBordered: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: SPACING.LG,
    marginBottom: SPACING.SM,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

// Note: Table styles are defined locally in PDFTable.tsx for cleaner encapsulation
