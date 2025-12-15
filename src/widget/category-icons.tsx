/**
 * Category Icons
 * 
 * Dynamic icon loading for help center categories.
 * Icons are loaded on-demand to reduce initial bundle size.
 * Only the icons actually used are fetched.
 * 
 * @module widget/category-icons
 */

import { useState, useEffect, memo } from 'react';

// Icon name to dynamic import mapping - only loads what's needed
const iconImports: Record<string, () => Promise<{ default: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }>> = {
  book: () => import('@untitledui/icons/BookOpen01').then(m => ({ default: m.BookOpen01 })),
  help: () => import('@untitledui/icons/HelpCircle').then(m => ({ default: m.HelpCircle })),
  user: () => import('@untitledui/icons/User01').then(m => ({ default: m.User01 })),
  billing: () => import('@untitledui/icons/CreditCard01').then(m => ({ default: m.CreditCard01 })),
  settings: () => import('@untitledui/icons/Settings01').then(m => ({ default: m.Settings01 })),
  email: () => import('@untitledui/icons/Mail01').then(m => ({ default: m.Mail01 })),
  phone: () => import('@untitledui/icons/Phone01').then(m => ({ default: m.Phone01 })),
  security: () => import('@untitledui/icons/Shield01').then(m => ({ default: m.Shield01 })),
  rocket: () => import('@untitledui/icons/Rocket01').then(m => ({ default: m.Rocket01 })),
  star: () => import('@untitledui/icons/Star01').then(m => ({ default: m.Star01 })),
  tools: () => import('@untitledui/icons/Tool01').then(m => ({ default: m.Tool01 })),
  idea: () => import('@untitledui/icons/Lightbulb01').then(m => ({ default: m.Lightbulb01 })),
  docs: () => import('@untitledui/icons/File06').then(m => ({ default: m.File06 })),
  home: () => import('@untitledui/icons/Home01').then(m => ({ default: m.Home01 })),
  shop: () => import('@untitledui/icons/ShoppingBag01').then(m => ({ default: m.ShoppingBag01 })),
  calendar: () => import('@untitledui/icons/Calendar').then(m => ({ default: m.Calendar })),
  globe: () => import('@untitledui/icons/Globe01').then(m => ({ default: m.Globe01 })),
  download: () => import('@untitledui/icons/DownloadCloud01').then(m => ({ default: m.DownloadCloud01 })),
  link: () => import('@untitledui/icons/Link01').then(m => ({ default: m.Link01 })),
  video: () => import('@untitledui/icons/PlayCircle').then(m => ({ default: m.PlayCircle })),
  gift: () => import('@untitledui/icons/Gift01').then(m => ({ default: m.Gift01 })),
  shipping: () => import('@untitledui/icons/Truck01').then(m => ({ default: m.Truck01 })),
  clock: () => import('@untitledui/icons/Clock').then(m => ({ default: m.Clock })),
  chat: () => import('@untitledui/icons/MessageChatCircle').then(m => ({ default: m.MessageChatCircle })),
  company: () => import('@untitledui/icons/Building07').then(m => ({ default: m.Building07 })),
};

export type CategoryIconName = keyof typeof iconImports;

// Cache for loaded icons to avoid re-fetching
const iconCache = new Map<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>();

interface CategoryIconProps {
  name?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Dynamic category icon component.
 * Loads icons on-demand and caches them for reuse.
 */
export const CategoryIcon = memo(({ name = 'book', className, style }: CategoryIconProps) => {
  const [Icon, setIcon] = useState<React.ComponentType<{ className?: string; style?: React.CSSProperties }> | null>(
    () => iconCache.get(name) || null
  );

  useEffect(() => {
    // If already cached, use it
    if (iconCache.has(name)) {
      setIcon(() => iconCache.get(name)!);
      return;
    }

    // Load the icon dynamically
    const loadIcon = iconImports[name as CategoryIconName] || iconImports.book;
    loadIcon().then(mod => {
      iconCache.set(name, mod.default);
      setIcon(() => mod.default);
    }).catch(() => {
      // Fallback to book icon on error
      if (name !== 'book') {
        iconImports.book().then(mod => {
          setIcon(() => mod.default);
        });
      }
    });
  }, [name]);

  // Placeholder while loading - matches icon dimensions
  if (!Icon) {
    return <div className={className} style={{ ...style, width: 20, height: 20 }} />;
  }

  return <Icon className={className} style={style} />;
});

CategoryIcon.displayName = 'CategoryIcon';

// Export icon options for admin UI (still needed for category configuration)
export const CATEGORY_ICON_OPTIONS: Array<{ value: CategoryIconName; label: string }> = [
  { value: 'book', label: 'Getting Started' },
  { value: 'help', label: 'Help & FAQ' },
  { value: 'user', label: 'Account' },
  { value: 'billing', label: 'Billing' },
  { value: 'settings', label: 'Settings' },
  { value: 'email', label: 'Contact' },
  { value: 'phone', label: 'Support' },
  { value: 'security', label: 'Security' },
  { value: 'rocket', label: 'Features' },
  { value: 'star', label: 'Highlights' },
  { value: 'tools', label: 'Tools' },
  { value: 'idea', label: 'Tips' },
  { value: 'docs', label: 'Documentation' },
  { value: 'home', label: 'General' },
  { value: 'shop', label: 'Shopping' },
  { value: 'calendar', label: 'Scheduling' },
  { value: 'globe', label: 'International' },
  { value: 'download', label: 'Downloads' },
  { value: 'link', label: 'Integrations' },
  { value: 'video', label: 'Tutorials' },
  { value: 'gift', label: 'Promotions' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'clock', label: 'Hours' },
  { value: 'chat', label: 'Messaging' },
  { value: 'company', label: 'Company' },
];
