/**
 * Sidebar State Management
 * 
 * Provides global sidebar collapse state using the Observer pattern.
 * Allows components to subscribe to sidebar state changes without prop drilling.
 * 
 * @module lib/sidebar-state
 */

/**
 * Global sidebar state manager implementing the Observer pattern.
 * Manages collapsed/expanded state and notifies subscribers on changes.
 * 
 * @example
 * // Check current state
 * if (sidebarState.isCollapsed()) {
 *   showCompactView();
 * }
 * 
 * @example
 * // Subscribe to changes
 * useEffect(() => {
 *   const unsubscribe = sidebarState.subscribe(() => {
 *     setCollapsed(sidebarState.isCollapsed());
 *   });
 *   return unsubscribe;
 * }, []);
 * 
 * @example
 * // Toggle sidebar
 * <Button onClick={() => sidebarState.toggle()}>Toggle</Button>
 */
class SidebarState {
  /** Current collapsed state */
  private collapsed = false;
  /** Array of listener callbacks */
  private listeners: (() => void)[] = [];

  /**
   * Gets the current collapsed state of the sidebar.
   * @returns True if sidebar is collapsed, false if expanded
   */
  isCollapsed(): boolean {
    return this.collapsed;
  }

  /**
   * Sets the sidebar collapsed state and notifies all subscribers.
   * @param collapsed - New collapsed state
   */
  setCollapsed(collapsed: boolean): void {
    this.collapsed = collapsed;
    this.notifyListeners();
  }

  /**
   * Toggles the sidebar between collapsed and expanded states.
   * Notifies all subscribers after state change.
   */
  toggle(): void {
    this.collapsed = !this.collapsed;
    this.notifyListeners();
  }

  /**
   * Subscribes a callback to sidebar state changes.
   * 
   * @param listener - Callback function invoked when state changes
   * @returns Unsubscribe function to remove the listener
   * 
   * @example
   * const unsubscribe = sidebarState.subscribe(() => {
   *   console.log('Sidebar state changed:', sidebarState.isCollapsed());
   * });
   * // Later: unsubscribe();
   */
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notifies all subscribed listeners of state change.
   * @internal
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

/** Global singleton instance of SidebarState */
export const sidebarState = new SidebarState();
