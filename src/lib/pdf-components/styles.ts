/**
 * PDF Design System Styles
 * 
 * StyleSheet definitions for @react-pdf/renderer aligned with ChatPad branding.
 */

import { StyleSheet } from '@react-pdf/renderer';

// ChatPad Brand Colors - Clean, professional palette
export const colors = {
  // Primary text & backgrounds
  primary: '#0f172a',       // slate-900
  secondary: '#475569',      // slate-600
  muted: '#94a3b8',          // slate-400
  
  // Accent colors - vibrant for charts and highlights
  accent: '#0d9488',         // teal-600 (brand accent)
  success: '#10b981',        // emerald-500
  warning: '#f59e0b',        // amber-500
  danger: '#ef4444',         // red-500
  
  // Backgrounds
  bg: '#ffffff',             // pure white
  bgAlt: '#f8fafc',          // slate-50 (subtle alternating)
  bgMuted: '#f1f5f9',        // slate-100
  white: '#ffffff',
  
  // Borders
  border: '#e2e8f0',         // slate-200
  borderLight: '#f1f5f9',    // slate-100
  
  // Header
  headerBg: '#0f172a',       // slate-900
  headerText: '#ffffff',
  headerSubtext: '#94a3b8',  // slate-400
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
    paddingBottom: 60, // Space for footer
  },

  // Content area (below header)
  content: {
    paddingHorizontal: PAGE.MARGIN,
    paddingTop: SPACING.LG,
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

// Table styles
export const tableStyles = StyleSheet.create({
  table: {
    width: '100%',
    marginBottom: SPACING.MD,
  },
  
  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  
  headerCell: {
    flex: 1,
    padding: SPACING.SM,
    color: colors.white,
    fontSize: FONT_SIZE.SM,
    fontWeight: 600,
  },
  
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  
  rowAlt: {
    flexDirection: 'row',
    backgroundColor: colors.bgAlt,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  
  cell: {
    flex: 1,
    padding: SPACING.SM,
    fontSize: FONT_SIZE.BASE,
  },
});
