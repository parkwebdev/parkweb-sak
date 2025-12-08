import { useState, useEffect } from 'react';
import { sidebarState } from '@/lib/sidebar-state';

/**
 * Custom hook for managing sidebar collapsed state.
 * Provides reactive state that syncs with the global sidebar state manager.
 * Persists sidebar state across sessions via the sidebarState utility.
 * 
 * @returns Object containing:
 * - isCollapsed: Current collapsed state of the sidebar
 * - toggle: Function to toggle the sidebar collapsed state
 * - setCollapsed: Function to explicitly set the collapsed state
 * 
 * @example
 * ```tsx
 * const { isCollapsed, toggle, setCollapsed } = useSidebar();
 * 
 * // Toggle sidebar
 * <Button onClick={toggle}>Toggle Sidebar</Button>
 * 
 * // Explicitly collapse
 * <Button onClick={() => setCollapsed(true)}>Collapse</Button>
 * ```
 */
export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(sidebarState.isCollapsed());

  useEffect(() => {
    const unsubscribe = sidebarState.subscribe(() => {
      setIsCollapsed(sidebarState.isCollapsed());
    });

    return unsubscribe;
  }, []);

  const toggle = () => {
    sidebarState.toggle();
  };

  const setCollapsed = (collapsed: boolean) => {
    sidebarState.setCollapsed(collapsed);
  };

  return {
    isCollapsed,
    toggle,
    setCollapsed
  };
}