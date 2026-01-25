/**
 * Help Center TopBar Actions
 * 
 * Action buttons for articles: keyboard shortcuts, copy link, share.
 * Displayed in the TopBar right section when viewing an article.
 * 
 * @module components/help-center/HCTopBarActions
 */

import { Share07 } from '@untitledui/icons';
import { CopyButton } from '@/components/ui/copy-button';
import { IconButton } from '@/components/ui/icon-button';
import { HCKeyboardShortcutsDropdown } from './HCKeyboardShortcutsDropdown';
import type { PlatformHCCategory, PlatformHCArticle } from '@/hooks/usePlatformHelpCenter';

interface HCTopBarActionsProps {
  category: PlatformHCCategory;
  article: PlatformHCArticle;
}

export function HCTopBarActions({ category, article }: HCTopBarActionsProps) {
  const articleUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/help-center?category=${category.id}&article=${article.slug}`
    : '';
  
  const handleShare = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: article.title,
          text: article.description || undefined,
          url: articleUrl,
        });
      } catch {
        // User cancelled or share failed - ignore
      }
    }
  };
  
  return (
    <div className="flex items-center gap-1">
      <HCKeyboardShortcutsDropdown />
      <CopyButton
        content={articleUrl}
        showToast
        toastMessage="Article link copied!"
        variant="ghost"
        size="sm"
      />
      {typeof navigator.share === 'function' && (
        <IconButton
          label="Share article"
          variant="ghost"
          size="sm"
          onClick={handleShare}
        >
          <Share07 size={16} aria-hidden="true" />
        </IconButton>
      )}
    </div>
  );
}
