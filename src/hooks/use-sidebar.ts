import { useState, useEffect } from 'react';
import { sidebarState } from '@/lib/sidebar-state';

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