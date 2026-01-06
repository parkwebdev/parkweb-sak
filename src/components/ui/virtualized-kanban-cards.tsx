/**
 * Virtualized Kanban Cards Component
 * 
 * Uses @tanstack/react-virtual for efficient rendering of many cards per column.
 * Only renders visible cards for improved performance with 100+ leads per stage.
 * 
 * @component
 */

import { useRef, useCallback, useContext, type HTMLAttributes, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

import { KanbanContext } from '@/components/ui/kanban';

// Re-use the base item type from kanban
type KanbanItemProps = {
  id: string;
  name: string;
  column: string;
} & Record<string, unknown>;

// Context type for type assertion
type KanbanContextData<T extends KanbanItemProps = KanbanItemProps> = {
  columns: { id: string; name: string }[];
  data: T[];
  activeCardId: string | null;
  activeCardContent: ReactNode | null;
};

export type VirtualizedKanbanCardsProps<T extends KanbanItemProps = KanbanItemProps> = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'id'
> & {
  children: (item: T) => ReactNode;
  id: string;
  /** Estimated card height for virtualization */
  estimatedCardHeight?: number;
  /** Number of items to render outside viewport */
  overscan?: number;
};

export function VirtualizedKanbanCards<T extends KanbanItemProps>({
  children,
  className,
  id,
  estimatedCardHeight = 120,
  overscan = 3,
  ...props
}: VirtualizedKanbanCardsProps<T>) {
  const { data } = useContext(KanbanContext) as KanbanContextData<T>;
  const filteredData = data.filter((item: T) => item.column === id);
  const items = filteredData.map((item: T) => item.id);
  
  const parentRef = useRef<HTMLDivElement>(null);
  
  const getScrollElement = useCallback(() => parentRef.current, []);
  const estimateSize = useCallback(() => estimatedCardHeight, [estimatedCardHeight]);
  const getItemKey = useCallback(
    (index: number) => filteredData[index]?.id ?? index,
    [filteredData]
  );

  const virtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement,
    estimateSize,
    overscan,
    getItemKey,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // For small lists, don't virtualize - just render normally
  if (filteredData.length <= 15) {
    return (
      <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
        <ScrollArea className="max-h-[calc(100vh-180px)]">
          <div
            className={cn("flex flex-col gap-2 p-0.5 min-h-[100px]", className)}
            {...props}
          >
            {filteredData.map(children)}
          </div>
          <ScrollBar />
        </ScrollArea>
      </SortableContext>
    );
  }

  // For large lists, use virtualization
  return (
    <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
      <div
        ref={parentRef}
        className={cn("max-h-[calc(100vh-180px)] overflow-auto", className)}
        {...props}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
          className="min-h-[100px]"
        >
          {virtualItems.map((virtualItem) => {
            const item = filteredData[virtualItem.index];
            return (
              <div
                key={item.id}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                  padding: '0 2px',
                }}
              >
                <div className="pb-2">
                  {children(item)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SortableContext>
  );
}
