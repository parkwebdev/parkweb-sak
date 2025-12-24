/**
 * TranslationBanner Component
 * 
 * Banner displayed below the chat header for non-English conversations.
 * Shows detected language and translation toggle button.
 * 
 * @component
 */

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Translate01 } from '@untitledui/icons';
import { getLanguageFlag } from '@/lib/language-utils';

export interface TranslationBannerProps {
  detectedLanguageCode: string;
  detectedLanguageName?: string;
  showTranslation: boolean;
  isTranslating: boolean;
  onToggleTranslation: () => void;
  onTranslate: () => void;
}

export const TranslationBanner = memo(function TranslationBanner({
  detectedLanguageCode,
  detectedLanguageName,
  showTranslation,
  isTranslating,
  onToggleTranslation,
  onTranslate,
}: TranslationBannerProps) {
  const displayName = detectedLanguageName || detectedLanguageCode;

  const handleClick = () => {
    if (showTranslation) {
      onToggleTranslation();
    } else {
      onTranslate();
    }
  };

  return (
    <div className="px-6 py-2.5 border-b bg-accent/30 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-base">{getLanguageFlag(detectedLanguageCode)}</span>
        <span className="text-muted-foreground">
          This conversation is in <span className="font-medium text-foreground">{displayName}</span>
        </span>
      </div>
      <Button 
        size="sm" 
        variant="outline"
        onClick={handleClick}
        disabled={isTranslating}
        className="gap-2"
      >
        <Translate01 size={16} />
        {isTranslating ? 'Translating...' : showTranslation ? 'Show Original' : 'Translate to English'}
      </Button>
    </div>
  );
});

export default TranslationBanner;
