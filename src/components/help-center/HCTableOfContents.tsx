/**
 * Help Center Table of Contents
 * 
 * Left sidebar showing article headings with scroll tracking.
 * Features real-time heading extraction, click-to-scroll,
 * hierarchy visualization, and collapsible sections.
 * 
 * @see docs/ARTICLE_EDITOR.md
 * @module components/help-center/HCTableOfContents
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, ChevronRight } from '@untitledui/icons';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springs } from '@/lib/motion-variants';

export interface Heading {
  id: string;
  text: string;
  level: number;
}

interface HeadingNode extends Heading {
  children: HeadingNode[];
}

interface HCTableOfContentsProps {
  headings: Heading[];
  /** Optional container element to observe scroll within */
  scrollContainerRef?: React.RefObject<HTMLElement>;
  /** Show search filter input */
  showSearch?: boolean;
}

/**
 * Build a hierarchical tree from flat headings list.
 * H1 headings are root, H2 are children of H1, H3 are children of H2.
 */
function buildHeadingTree(headings: Heading[]): HeadingNode[] {
  const tree: HeadingNode[] = [];
  const stack: HeadingNode[] = [];
  
  for (const heading of headings) {
    const node: HeadingNode = { ...heading, children: [] };
    
    // Find appropriate parent based on heading level
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }
    
    if (stack.length === 0) {
      // Root level heading
      tree.push(node);
    } else {
      // Child of current stack top
      stack[stack.length - 1].children.push(node);
    }
    
    stack.push(node);
  }
  
  return tree;
}

/**
 * Flatten tree back to array for filtering.
 */
function flattenTree(tree: HeadingNode[]): Heading[] {
  const result: Heading[] = [];
  
  function traverse(nodes: HeadingNode[]) {
    for (const node of nodes) {
      result.push({ id: node.id, text: node.text, level: node.level });
      traverse(node.children);
    }
  }
  
  traverse(tree);
  return result;
}

interface HeadingItemProps {
  node: HeadingNode;
  activeId: string;
  collapsedIds: Set<string>;
  onToggle: (id: string) => void;
  onScrollTo: (id: string) => void;
  depth: number;
}

function HeadingItem({ node, activeId, collapsedIds, onToggle, onScrollTo, depth }: HeadingItemProps) {
  const isActive = node.id === activeId;
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsedIds.has(node.id);
  
  // Indentation based on heading level: H1 = 0, H2 = 12px, H3 = 24px
  const paddingLeft = (node.level - 1) * 12;
  
  return (
    <li>
      <div className="flex items-center">
        {/* Collapse toggle */}
        {hasChildren ? (
          <button
            onClick={() => onToggle(node.id)}
            className="h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0"
            aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? (
              <ChevronRight size={12} aria-hidden="true" />
            ) : (
              <ChevronDown size={12} aria-hidden="true" />
            )}
          </button>
        ) : (
          <span className="w-5 flex-shrink-0" />
        )}
        
        {/* Heading button */}
        <button
          onClick={() => onScrollTo(node.id)}
          style={{ paddingLeft }}
          className={cn(
            'flex-1 text-left text-xs py-1 pr-2 transition-colors truncate',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded',
            isActive
              ? 'text-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-current={isActive ? 'true' : undefined}
        >
          <span className="flex items-center gap-1.5">
            {isActive && (
              <span className="w-0.5 h-3.5 bg-foreground rounded-full flex-shrink-0" aria-hidden="true" />
            )}
            <span className="truncate">
              {node.text || 'Untitled'}
            </span>
          </span>
        </button>
      </div>
      
      {/* Children */}
      {hasChildren && !isCollapsed && (
        <ul className="mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <HeadingItem
              key={child.id}
              node={child}
              activeId={activeId}
              collapsedIds={collapsedIds}
              onToggle={onToggle}
              onScrollTo={onScrollTo}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function HCTableOfContents({ 
  headings, 
  scrollContainerRef,
  showSearch = false 
}: HCTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const prefersReducedMotion = useReducedMotion();
  
  // Build hierarchical tree from flat headings
  const headingTree = useMemo(() => buildHeadingTree(headings), [headings]);
  
  // Filter headings based on search
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return headingTree;
    
    const query = searchQuery.toLowerCase();
    
    function filterNodes(nodes: HeadingNode[]): HeadingNode[] {
      return nodes.reduce<HeadingNode[]>((acc, node) => {
        const matchesText = node.text.toLowerCase().includes(query);
        const filteredChildren = filterNodes(node.children);
        
        if (matchesText || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren,
          });
        }
        
        return acc;
      }, []);
    }
    
    return filterNodes(headingTree);
  }, [headingTree, searchQuery]);
  
  // Toggle section collapse
  const handleToggle = useCallback((id: string) => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
  
  // Track active heading based on scroll position
  useEffect(() => {
    if (headings.length === 0) return;
    
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    const root = scrollContainerRef?.current || null;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the first visible entry from top
        const visibleEntries = entries.filter(e => e.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by their position (boundingClientRect.top)
          visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActiveId(visibleEntries[0].target.id);
        }
      },
      {
        root,
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0,
      }
    );
    
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) {
        observerRef.current?.observe(element);
      }
    });
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [headings, scrollContainerRef]);
  
  // Smooth scroll to heading
  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  }, []);
  
  if (headings.length === 0) {
    return (
      <nav className="p-4" aria-label="Table of contents">
        <h2 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">
          On This Page
        </h2>
        <p className="text-xs text-muted-foreground italic">
          No headings yet
        </p>
      </nav>
    );
  }

  return (
    <nav className="p-4" aria-label="Table of contents">
      <h2 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">
        On This Page
      </h2>
      
      {/* Optional search filter */}
      {showSearch && (
        <div className="mb-3">
          <Input
            type="search"
            placeholder="Filter headings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="sm"
            className="h-7 text-xs"
          />
        </div>
      )}
      
      {filteredTree.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No matching headings
        </p>
      ) : (
        <motion.ul 
          className="space-y-0.5"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.02 } }
          }}
        >
          {filteredTree.map((node) => (
            <motion.li
              key={node.id}
              variants={{
                hidden: prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -4 },
                visible: { opacity: 1, x: 0 }
              }}
              transition={springs.smooth}
            >
              <HeadingItem
                node={node}
                activeId={activeId}
                collapsedIds={collapsedIds}
                onToggle={handleToggle}
                onScrollTo={scrollToHeading}
                depth={0}
              />
            </motion.li>
          ))}
        </motion.ul>
      )}
    </nav>
  );
}
