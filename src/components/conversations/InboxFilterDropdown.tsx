/**
 * Inbox Filter Dropdown
 * 
 * A dropdown menu for filtering conversations, replacing the sidebar.
 * Preserves hierarchy (Ari, Tickets, Channels) with icons and labels.
 */

import React from 'react';
import AriAgentsIcon from '@/components/icons/AriAgentsIcon';
import { CheckCircle, ChevronDown, Globe01, Inbox01, Ticket01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { InboxFilter } from './InboxNavSidebar';

// Social channel logos
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

interface FilterCounts {
  all: number;
  yours: number;
  resolved: number;
  widget: number;
  facebook: number;
  instagram: number;
  x: number;
}

interface InboxFilterDropdownProps {
  activeFilter: InboxFilter;
  onFilterChange: (filter: InboxFilter) => void;
  counts: FilterCounts;
}

// Get icon for current filter
function getFilterIcon(filter: InboxFilter) {
  if (filter.type === 'all') return <AriAgentsIcon className="h-4 w-4" />;
  if (filter.type === 'yours') return <Inbox01 size={16} />;
  if (filter.type === 'status' && filter.value === 'closed') return <CheckCircle size={16} />;
  if (filter.type === 'channel') {
    if (filter.value === 'widget') return <Globe01 size={16} />;
    if (filter.value === 'facebook') return <FacebookLogo />;
    if (filter.value === 'instagram') return <InstagramLogo />;
    if (filter.value === 'x') return <XLogo />;
  }
  return <AriAgentsIcon className="h-4 w-4" />;
}

export function InboxFilterDropdown({ activeFilter, onFilterChange, counts }: InboxFilterDropdownProps) {
  const isActive = (type: string, value?: string) => 
    activeFilter.type === type && activeFilter.value === value;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 font-medium">
          <span className="text-muted-foreground">{getFilterIcon(activeFilter)}</span>
          <span>{activeFilter.label}</span>
          {counts[activeFilter.type === 'all' ? 'all' : 
                  activeFilter.type === 'yours' ? 'yours' : 
                  activeFilter.type === 'status' && activeFilter.value === 'closed' ? 'resolved' :
                  activeFilter.type === 'channel' ? (activeFilter.value as keyof FilterCounts) : 'all'] > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums bg-muted px-1.5 py-0.5 rounded-full">
              {counts[activeFilter.type === 'all' ? 'all' : 
                      activeFilter.type === 'yours' ? 'yours' : 
                      activeFilter.type === 'status' && activeFilter.value === 'closed' ? 'resolved' :
                      activeFilter.type === 'channel' ? (activeFilter.value as keyof FilterCounts) : 'all']}
            </span>
          )}
          <ChevronDown size={16} className="text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" sideOffset={4} className="w-56 space-y-0.5">
        {/* Ari Section */}
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Ari
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => onFilterChange({ type: 'all', label: 'All Conversations' })}
          className={cn("py-1.5", isActive('all') && 'bg-accent')}
        >
          <AriAgentsIcon className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="flex-1">All Conversations</span>
          {counts.all > 0 && <span className="text-xs text-muted-foreground tabular-nums">{counts.all}</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onFilterChange({ type: 'yours', label: 'Your Inbox' })}
          className={cn("py-1.5", isActive('yours') && 'bg-accent')}
        >
          <Inbox01 size={16} className="mr-2 text-muted-foreground" aria-hidden="true" />
          <span className="flex-1">Your Inbox</span>
          {counts.yours > 0 && <span className="text-xs text-muted-foreground tabular-nums">{counts.yours}</span>}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Tickets Section */}
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Tickets
        </DropdownMenuLabel>
        <DropdownMenuItem disabled className="py-1.5 opacity-50">
          <Ticket01 size={16} className="mr-2 text-muted-foreground" aria-hidden="true" />
          <span className="flex-1">All Tickets</span>
          <span className="text-2xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Soon</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onFilterChange({ type: 'status', value: 'closed', label: 'Resolved' })}
          className={cn("py-1.5", isActive('status', 'closed') && 'bg-accent')}
        >
          <CheckCircle size={16} className="mr-2 text-muted-foreground" aria-hidden="true" />
          <span className="flex-1">Resolved</span>
          {counts.resolved > 0 && <span className="text-xs text-muted-foreground tabular-nums">{counts.resolved}</span>}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Channels Section */}
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Channels
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => onFilterChange({ type: 'channel', value: 'widget', label: 'Widget' })}
          className={cn("py-1.5", isActive('channel', 'widget') && 'bg-accent')}
        >
          <Globe01 size={16} className="mr-2 text-muted-foreground" aria-hidden="true" />
          <span className="flex-1">Widget</span>
          {counts.widget > 0 && <span className="text-xs text-muted-foreground tabular-nums">{counts.widget}</span>}
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="py-1.5 opacity-50">
          <span className="mr-2 text-muted-foreground"><FacebookLogo /></span>
          <span className="flex-1">Facebook</span>
          <span className="text-2xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Soon</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="py-1.5 opacity-50">
          <span className="mr-2 text-muted-foreground"><InstagramLogo /></span>
          <span className="flex-1">Instagram</span>
          <span className="text-2xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Soon</span>
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="py-1.5 opacity-50">
          <span className="mr-2 text-muted-foreground"><XLogo /></span>
          <span className="flex-1">X (Twitter)</span>
          <span className="text-2xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Soon</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
