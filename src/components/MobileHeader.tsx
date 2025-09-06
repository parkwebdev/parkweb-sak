import React from 'react';
import { Menu01 as Menu, X } from '@untitledui/icons';
import { NotificationCenter } from './notifications/NotificationCenter';
import { ThemeToggle } from './ThemeToggle';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  isMenuOpen,
  onMenuToggle,
}) => {
  return (
    <header className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <ThemeToggle isCollapsed={false} />
        </div>
      </div>
    </header>
  );
};