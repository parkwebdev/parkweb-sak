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
  private collapsed = true;
  /** Whether the sidebar is locked open (e.g., dropdown is open) */
  private locked = false;
  /** Array of listener callbacks */
  private listeners: (() => void)[] = [];

  /**
   * Gets the current collapsed state of the sidebar.
   * Returns false (expanded) if sidebar is locked, regardless of collapsed state.
   * @returns True if sidebar is collapsed and not locked, false otherwise
   */
  isCollapsed(): boolean {
    return this.locked ? false : this.collapsed;
  }

  /**
   * Gets the locked state of the sidebar.
   * @returns True if sidebar is locked open
   */
  isLocked(): boolean {
    return this.locked;
  }

  /**
   * Sets the sidebar locked state.
   * When locked, sidebar will stay expanded regardless of hover state.
   * @param locked - New locked state
   */
  setLocked(locked: boolean): void {
    this.locked = locked;
    this.notifyListeners();
  }

  /**
   * Sets the sidebar collapsed state and notifies all subscribers.
   * If sidebar is locked, the state is stored but won't take effect until unlocked.
   * @param collapsed - New collapsed state
   */
  setCollapsed(collapsed: boolean): void {
    if (!this.locked) {
      this.collapsed = collapsed;
      this.notifyListeners();
    }
  }

  /**
   * Toggles the sidebar between collapsed and expanded states.
   * Notifies all subscribers after state change.
   */
  toggle(): void {
    if (!this.locked) {
      this.collapsed = !this.collapsed;
      this.notifyListeners();
    }
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
