// Global sidebar state management
class SidebarState {
  private collapsed = false;
  private listeners: (() => void)[] = [];

  isCollapsed(): boolean {
    return this.collapsed;
  }

  setCollapsed(collapsed: boolean): void {
    this.collapsed = collapsed;
    this.notifyListeners();
  }

  toggle(): void {
    this.collapsed = !this.collapsed;
    this.notifyListeners();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const sidebarState = new SidebarState();