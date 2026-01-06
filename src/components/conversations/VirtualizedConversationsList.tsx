/**
 * VirtualizedConversationsList Component
 * 
 * Virtualized list for conversations using @tanstack/react-virtual.
 * Only renders visible items for improved performance with large lists.
 * 
 * @component
 */

import React, { memo, useCallback, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MessageChatSquare, SwitchVertical01, ChevronDown } from '@untitledui/icons';
import { ConversationItem } from './ConversationItem';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tables } from '@/integrations/supabase/types';
import type { VisitorPresenceData } from '@/hooks/useVisitorPresence';

// Panel icon with left divider (for conversations sidebar)
const LayoutPanelLeft = ({ filled = false, className }: { filled?: boolean; className?: string }) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" className={className}>
    {filled && (
      <path
        d="M7.8 3C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H9V3H7.8Z"
        fill="currentColor"
      />
    )}
    <path
      d="M9 3V21M7.8 3H16.2C17.8802 3 18.7202 3 19.362 3.32698C19.9265 3.6146 20.3854 4.07354 20.673 4.63803C21 5.27976 21 6.11984 21 7.8V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V7.8C3 6.11984 3 5.27976 3.32698 4.63803C3.6146 4.07354 4.07354 3.6146 4.63803 3.32698C5.27976 3 6.11984 3 7.8 3Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
};

type SortBy = 'last_activity' | 'newest' | 'oldest';

/** Estimated height of each conversation item in pixels */
const ITEM_HEIGHT = 72;

export interface VirtualizedConversationsListProps {
  conversations: Conversation[];
  allConversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
  activeFilterLabel: string;
  getVisitorPresence: (conversation: Conversation) => VisitorPresenceData | null;
  loading: boolean;
  /** Whether there are more items to load */
  hasNextPage?: boolean;
  /** Whether currently loading more items */
  isFetchingNextPage?: boolean;
  /** Function to load more items */
  fetchNextPage?: () => void;
}

export const VirtualizedConversationsList = memo(function VirtualizedConversationsList({
  conversations,
  allConversations,
  selectedId,
  onSelect,
  isCollapsed,
  onToggleCollapse,
  sortBy,
  onSortChange,
  activeFilterLabel,
  getVisitorPresence,
  loading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: VirtualizedConversationsListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const handleCycleSortOrder = useCallback(() => {
    if (sortBy === 'last_activity') onSortChange('newest');
    else if (sortBy === 'newest') onSortChange('oldest');
    else onSortChange('last_activity');
  }, [sortBy, onSortChange]);

  const getSortLabel = useCallback((sort: SortBy) => {
    switch (sort) {
      case 'last_activity': return 'Last activity';
      case 'newest': return 'Newest first';
      case 'oldest': return 'Oldest first';
    }
  }, []);

  const openCount = allConversations.filter(c => c.status === 'active' || c.status === 'human_takeover').length;

  // Set up virtualizer
  const virtualizer = useVirtualizer({
    count: hasNextPage ? conversations.length + 1 : conversations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5, // Render 5 items above and below viewport
  });

  const items = virtualizer.getVirtualItems();

  // Trigger load more when scrolling near bottom
  useEffect(() => {
    const lastItem = items[items.length - 1];
    if (!lastItem) return;

    if (
      lastItem.index >= conversations.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage &&
      fetchNextPage
    ) {
      fetchNextPage();
    }
  }, [items, conversations.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div 
      className={`hidden lg:flex border-r flex-col bg-background min-h-0 transition-all duration-200 ease-in-out overflow-x-hidden ${
        isCollapsed ? 'w-12' : 'lg:w-80 xl:w-96'
      }`}
    >
      {/* Header */}
      <div className={`border-b shrink-0 ${isCollapsed ? 'h-14 px-2 flex items-center' : 'p-4 pb-3'}`}>
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-foreground">{activeFilterLabel}</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 w-7 p-0 transition-colors duration-200 ${isCollapsed ? 'mx-auto' : ''}`}
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand conversations' : 'Collapse conversations'}
          >
            <LayoutPanelLeft filled={isCollapsed} className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Filter badges row */}
        {!isCollapsed && (
          <div className="flex items-center justify-between mt-3">
            <Badge variant="secondary" className="font-medium">
              {openCount} Open
            </Badge>
            
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent">
                    <span>{getSortLabel(sortBy)}</span>
                    <ChevronDown size={12} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => onSortChange('last_activity')}>
                    Last activity
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSortChange('newest')}>
                    Newest first
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSortChange('oldest')}>
                    Oldest first
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <button 
                onClick={handleCycleSortOrder}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors"
                aria-label="Toggle sort order"
              >
                <SwitchVertical01 size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content - hidden when collapsed */}
      <div 
        className={`flex-1 min-h-0 flex flex-col transition-opacity duration-200 ${
          isCollapsed ? 'opacity-0 invisible' : 'opacity-100 visible'
        }`}
      >
        {/* Virtualized Conversation List */}
        <div 
          ref={parentRef}
          className="flex-1 min-h-0 overflow-y-auto"
        >
          {loading ? (
            <div className="space-y-1 p-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <MessageChatSquare size={48} className="mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No conversations yet</p>
              </div>
            </div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {items.map((virtualItem) => {
                const isLoaderRow = virtualItem.index >= conversations.length;
                
                if (isLoaderRow) {
                  return (
                    <div
                      key="loader"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      className="flex items-center justify-center"
                    >
                      {isFetchingNextPage ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          Loading more...
                        </div>
                      ) : hasNextPage ? (
                        <button
                          onClick={() => fetchNextPage?.()}
                          className="text-sm text-primary hover:underline"
                        >
                          Load more
                        </button>
                      ) : null}
                    </div>
                  );
                }

                const conv = conversations[virtualItem.index];
                return (
                  <div
                    key={conv.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <ConversationItem
                      conversation={conv}
                      isSelected={selectedId === conv.id}
                      onClick={() => onSelect(conv)}
                      isVisitorActive={!!getVisitorPresence(conv)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default VirtualizedConversationsList;
