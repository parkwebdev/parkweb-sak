/**
 * Help Center Category Colors
 * 
 * Centralized color configuration for HC categories.
 * Used by both user-facing Help Center and admin components.
 * 
 * @module lib/hc-category-colors
 */

/** Default colors for known category IDs */
export const HC_CATEGORY_COLORS: Record<string, string> = {
  'getting-started': 'bg-info',
  'ari': 'bg-accent-purple',
  'inbox': 'bg-warning',
  'leads': 'bg-success',
  'planner': 'bg-status-active',
  'analytics': 'bg-destructive',
  'settings': 'bg-muted-foreground',
};

/** Ring/background classes for active states */
export const HC_ACTIVE_RING_MAP: Record<string, string> = {
  'bg-info': 'ring-info/40 bg-info/10',
  'bg-accent-purple': 'ring-accent-purple/40 bg-accent-purple/10',
  'bg-success': 'ring-success/40 bg-success/10',
  'bg-warning': 'ring-warning/40 bg-warning/10',
  'bg-status-active': 'ring-status-active/40 bg-status-active/10',
  'bg-destructive': 'ring-destructive/40 bg-destructive/10',
  'bg-muted-foreground': 'ring-muted-foreground/40 bg-muted-foreground/10',
};

/** Hover classes for category items */
export const HC_HOVER_MAP: Record<string, string> = {
  'bg-info': 'hover:bg-info/5',
  'bg-accent-purple': 'hover:bg-accent-purple/5',
  'bg-success': 'hover:bg-success/5',
  'bg-warning': 'hover:bg-warning/5',
  'bg-status-active': 'hover:bg-status-active/5',
  'bg-destructive': 'hover:bg-destructive/5',
  'bg-muted-foreground': 'hover:bg-muted-foreground/5',
};

/** Gradient classes for article/category headers */
export const HC_GRADIENT_MAP: Record<string, string> = {
  'bg-info': 'from-info/15 via-info/5 to-transparent',
  'bg-accent-purple': 'from-accent-purple/15 via-accent-purple/5 to-transparent',
  'bg-success': 'from-success/15 via-success/5 to-transparent',
  'bg-warning': 'from-warning/15 via-warning/5 to-transparent',
  'bg-status-active': 'from-status-active/15 via-status-active/5 to-transparent',
  'bg-destructive': 'from-destructive/15 via-destructive/5 to-transparent',
  'bg-muted-foreground': 'from-muted/15 via-muted/5 to-transparent',
};

/** Solid background classes for article/category headers */
export const HC_SOLID_BG_MAP: Record<string, string> = {
  'bg-info': 'bg-info/10',
  'bg-accent-purple': 'bg-accent-purple/10',
  'bg-success': 'bg-success/10',
  'bg-warning': 'bg-warning/10',
  'bg-status-active': 'bg-status-active/10',
  'bg-destructive': 'bg-destructive/10',
  'bg-muted-foreground': 'bg-muted/10',
};

/** Badge classes for category-colored badges */
export const HC_BADGE_MAP: Record<string, string> = {
  'bg-info': 'bg-info/15 text-info border-info/20',
  'bg-accent-purple': 'bg-accent-purple/15 text-accent-purple border-accent-purple/20',
  'bg-success': 'bg-success/15 text-success border-success/20',
  'bg-warning': 'bg-warning/15 text-warning border-warning/20',
  'bg-status-active': 'bg-status-active/15 text-status-active border-status-active/20',
  'bg-destructive': 'bg-destructive/15 text-destructive border-destructive/20',
  'bg-muted-foreground': 'bg-muted text-muted-foreground border-border',
};

/** Available color options for category creation/editing */
export const HC_COLOR_OPTIONS = [
  { value: 'bg-info', label: 'Blue' },
  { value: 'bg-accent-purple', label: 'Purple' },
  { value: 'bg-success', label: 'Green' },
  { value: 'bg-warning', label: 'Orange' },
  { value: 'bg-status-active', label: 'Teal' },
  { value: 'bg-destructive', label: 'Red' },
  { value: 'bg-muted-foreground', label: 'Gray' },
];

/**
 * Get the color class for a category, with fallback.
 * Tries: category.color from DB → HC_CATEGORY_COLORS by ID → default
 */
export function getCategoryColor(categoryId: string, dbColor?: string): string {
  // If DB has a valid bg- class, use it
  if (dbColor?.startsWith('bg-')) {
    return dbColor;
  }
  // Fallback to known category colors
  return HC_CATEGORY_COLORS[categoryId] || 'bg-muted-foreground';
}

/**
 * Get active ring classes for a color
 */
export function getActiveRing(colorClass: string): string {
  return HC_ACTIVE_RING_MAP[colorClass] || 'ring-muted-foreground/40 bg-muted-foreground/10';
}

/**
 * Get hover classes for a color
 */
export function getHoverClass(colorClass: string): string {
  return HC_HOVER_MAP[colorClass] || 'hover:bg-muted-foreground/5';
}

/**
 * Get gradient classes for a color
 */
export function getGradientClass(colorClass: string): string {
  return HC_GRADIENT_MAP[colorClass] || 'from-muted/15 via-muted/5 to-transparent';
}

/**
 * Get solid background class for a color (headers)
 */
export function getSolidBgClass(colorClass: string): string {
  return HC_SOLID_BG_MAP[colorClass] || 'bg-muted/10';
}

/**
 * Get badge classes for a category color
 */
export function getCategoryBadgeClasses(colorClass: string): string {
  return HC_BADGE_MAP[colorClass] || 'bg-muted text-muted-foreground';
}
