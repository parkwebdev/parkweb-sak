/**
 * Inbox Navigation Sidebar
 * 
 * Left-side navigation for filtering conversations by source/status.
 * Fixed width, not collapsible.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import AriAgentsIcon from '@/components/icons/AriAgentsIcon';
import { CheckCircle, Globe01, Inbox01, SearchMd, XClose, Ticket01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';

// Social channel logos (matching AriIntegrationsSection)
const FacebookLogo = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramLogo = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const XLogo = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export type InboxFilter = {
  type: 'all' | 'status' | 'channel' | 'yours';
  value?: string;
  label: string;
};

interface InboxNavSidebarProps {
  activeFilter: InboxFilter;
  onFilterChange: (filter: InboxFilter) => void;
  counts: {
    all: number;
    yours: number;
    resolved: number;
    widget: number;
    facebook: number;
    instagram: number;
    x: number;
  };
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
  animationIndex: number;
  prefersReducedMotion: boolean;
}

const NavItem = React.memo(function NavItem({ icon, label, count, isActive, onClick, disabled, comingSoon, animationIndex, prefersReducedMotion }: NavItemProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
        'hover:bg-accent',
        isActive && 'bg-accent text-accent-foreground font-medium',
        disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
      )}
      initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: animationIndex * 0.02, ...springs.smooth }}
    >
      <span className="flex-shrink-0 text-muted-foreground">{icon}</span>
      <span className="flex-1 text-left truncate">{label}</span>
      {comingSoon ? (
        <span className="text-2xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Soon</span>
      ) : count !== undefined && count > 0 ? (
        <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
      ) : null}
    </motion.button>
  );
});

export const InboxNavSidebar = React.memo(function InboxNavSidebar({ activeFilter, onFilterChange, counts, searchQuery, onSearchChange }: InboxNavSidebarProps) {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const prefersReducedMotion = useReducedMotion();
  
  const isActive = useCallback((type: string, value?: string) => 
    activeFilter.type === type && activeFilter.value === value, [activeFilter]);

  // Focus input when search expands
  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  // Close search when clicking outside or pressing Escape
  const handleSearchBlur = useCallback(() => {
    if (!searchQuery) {
      setSearchExpanded(false);
    }
  }, [searchQuery]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onSearchChange('');
      setSearchExpanded(false);
    }
  }, [onSearchChange]);

  const handleClearSearch = useCallback(() => {
    onSearchChange('');
    setSearchExpanded(false);
  }, [onSearchChange]);

  // Track animation index across all sections
  let animationIndex = 0;

  return (
    <div className="w-48 border-r bg-background flex flex-col">
      {/* Header with Inbox title and search */}
      <div className="h-14 border-b flex items-center">
        <div className="flex items-center justify-between px-3">
          {searchExpanded ? (
            <div className="flex-1 flex items-center gap-2">
              <Input
                ref={searchInputRef}
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onBlur={handleSearchBlur}
                onKeyDown={handleSearchKeyDown}
                className="h-7 text-sm bg-muted/50 border-0"
              />
              <button
                onClick={handleClearSearch}
                className="p-1 hover:bg-accent rounded"
              >
                <XClose size={14} className="text-muted-foreground" />
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-foreground">Inbox</h2>
              <button
                onClick={() => setSearchExpanded(true)}
                className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Search conversations"
              >
                <SearchMd size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Ari Section */}
      <div className="p-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">
          Ari
        </h3>
        <div className="space-y-0.5">
          <NavItem
            icon={<AriAgentsIcon className="h-4 w-4" />}
            label="All Conversations"
            count={counts.all}
            isActive={isActive('all')}
            onClick={() => onFilterChange({ type: 'all', label: 'All Conversations' })}
            animationIndex={animationIndex++}
            prefersReducedMotion={prefersReducedMotion}
          />
          <NavItem
            icon={<Inbox01 size={16} />}
            label="Your Inbox"
            count={counts.yours}
            isActive={isActive('yours')}
            onClick={() => onFilterChange({ type: 'yours', label: 'Your Inbox' })}
            animationIndex={animationIndex++}
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>
      </div>

      {/* Tickets Section */}
      <div className="p-3 pt-0">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">
          Tickets
        </h3>
        <div className="space-y-0.5">
          <NavItem
            icon={<Ticket01 size={16} />}
            label="All Tickets"
            isActive={false}
            onClick={() => {}}
            disabled
            comingSoon
            animationIndex={animationIndex++}
            prefersReducedMotion={prefersReducedMotion}
          />
          <NavItem
            icon={<CheckCircle size={16} />}
            label="Resolved"
            count={counts.resolved}
            isActive={isActive('status', 'closed')}
            onClick={() => onFilterChange({ type: 'status', value: 'closed', label: 'Resolved' })}
            animationIndex={animationIndex++}
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>
      </div>

      {/* Channels Section */}
      <div className="p-3 pt-0">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">
          Channels
        </h3>
        <div className="space-y-0.5">
          <NavItem
            icon={<Globe01 size={16} />}
            label="Widget"
            count={counts.widget}
            isActive={isActive('channel', 'widget')}
            onClick={() => onFilterChange({ type: 'channel', value: 'widget', label: 'Widget' })}
            animationIndex={animationIndex++}
            prefersReducedMotion={prefersReducedMotion}
          />
          <NavItem
            icon={<FacebookLogo />}
            label="Facebook"
            count={counts.facebook}
            isActive={isActive('channel', 'facebook')}
            onClick={() => onFilterChange({ type: 'channel', value: 'facebook', label: 'Facebook' })}
            disabled
            comingSoon
            animationIndex={animationIndex++}
            prefersReducedMotion={prefersReducedMotion}
          />
          <NavItem
            icon={<InstagramLogo />}
            label="Instagram"
            count={counts.instagram}
            isActive={isActive('channel', 'instagram')}
            onClick={() => onFilterChange({ type: 'channel', value: 'instagram', label: 'Instagram' })}
            disabled
            comingSoon
            animationIndex={animationIndex++}
            prefersReducedMotion={prefersReducedMotion}
          />
          <NavItem
            icon={<XLogo />}
            label="X (Twitter)"
            count={counts.x}
            isActive={isActive('channel', 'x')}
            onClick={() => onFilterChange({ type: 'channel', value: 'x', label: 'X (Twitter)' })}
            disabled
            comingSoon
            animationIndex={animationIndex++}
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>
      </div>
    </div>
  );
});
