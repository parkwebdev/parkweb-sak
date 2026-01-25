/**
 * @fileoverview Compact preview controls for the Admin Emails TopBar.
 * Includes Device, Theme, and Preview Mode toggles in a horizontal row.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Phone01, Monitor01, Sun, Moon01 } from '@untitledui/icons';
import { EmailPreviewModeToggle, type EmailPreviewMode } from '@/components/email/EmailPreviewModeToggle';
import type { PreviewWidth } from '@/components/email/EmailTemplateSidebar';
import { cn } from '@/lib/utils';

interface EmailPreviewControlsProps {
  previewWidth: PreviewWidth;
  onPreviewWidthChange: (width: PreviewWidth) => void;
  darkMode: boolean;
  onDarkModeChange: (dark: boolean) => void;
  previewMode: EmailPreviewMode;
  onPreviewModeChange: (mode: EmailPreviewMode) => void;
  showSupabaseOption?: boolean;
}

/** Compact icon-only toggle for Device/Theme */
function CompactToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; icon: React.ComponentType<{ size?: number }> }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const [hovered, setHovered] = useState<T | null>(null);
  const currentIndex = options.findIndex(opt => opt.id === (hovered ?? value));

  return (
    <div
      className="relative flex rounded-lg border overflow-hidden"
      onMouseLeave={() => setHovered(null)}
    >
      <motion.div
        className="absolute inset-y-0 bg-muted"
        style={{ width: `${100 / options.length}%` }}
        initial={false}
        animate={{ x: `${currentIndex * 100}%` }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      />
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            onMouseEnter={() => setHovered(option.id)}
            className={cn(
              'relative z-10 flex h-8 w-9 items-center justify-center transition-colors',
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label={option.id}
            aria-pressed={isActive}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}

export function EmailPreviewControls({
  previewWidth,
  onPreviewWidthChange,
  darkMode,
  onDarkModeChange,
  previewMode,
  onPreviewModeChange,
  showSupabaseOption = false,
}: EmailPreviewControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Device Toggle */}
      <CompactToggle
        options={[
          { id: 'mobile' as const, icon: Phone01 },
          { id: 'desktop' as const, icon: Monitor01 },
        ]}
        value={previewWidth}
        onChange={onPreviewWidthChange}
      />

      {/* Theme Toggle */}
      <CompactToggle
        options={[
          { id: 'light' as const, icon: Sun },
          { id: 'dark' as const, icon: Moon01 },
        ]}
        value={darkMode ? 'dark' : 'light'}
        onChange={(v) => onDarkModeChange(v === 'dark')}
      />

      {/* Preview Mode Toggle */}
      <EmailPreviewModeToggle
        mode={previewMode}
        onModeChange={onPreviewModeChange}
        showSupabaseOption={showSupabaseOption}
      />
    </div>
  );
}
