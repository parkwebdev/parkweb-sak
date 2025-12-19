/**
 * @fileoverview Application header with mobile menu button.
 */

import React from 'react';
import { Menu01 as Menu } from '@untitledui/icons';
import { Button } from '@/components/ui/button';

interface AppHeaderProps {
  onMenuClick: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-border bg-card/50 backdrop-blur-sm z-30 relative">
      {/* Left side - Menu */}
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          aria-label="Open navigation menu"
          onClick={onMenuClick}
        >
          <Menu size={18} aria-hidden="true" />
        </Button>
      </div>

      {/* Right side actions - currently empty */}
      <div className="flex items-center gap-2">
      </div>
    </header>
  );
};
