import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChatWidgetStandalone } from './ChatWidgetStandalone';
import { WIDGET_STYLES } from './widget-styles';

// Global widget interface
interface ChatPadWidgetConfig {
  agentId: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor?: string;
}

class ChatPadWidget {
  private container: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private root: any = null;
  private config: ChatPadWidgetConfig;

  constructor(config: ChatPadWidgetConfig) {
    this.config = config;
  }

  async init() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'chatpad-widget-container';
    document.body.appendChild(this.container);

    // Create shadow DOM for CSS isolation
    this.shadowRoot = this.container.attachShadow({ mode: 'open' });

    // Create root element inside shadow DOM
    const rootElement = document.createElement('div');
    rootElement.id = 'chatpad-widget-root';
    this.shadowRoot.appendChild(rootElement);

    // Inject styles into shadow DOM
    const styleSheet = document.createElement('style');
    styleSheet.textContent = this.getStyles();
    this.shadowRoot.appendChild(styleSheet);

    // Mount React app
    this.root = createRoot(rootElement);
    this.root.render(
      <React.StrictMode>
        <ChatWidgetStandalone config={this.config} />
      </React.StrictMode>
    );
  }

  private getStyles(): string {
    // Return all widget styles (injected into shadow DOM)
    return WIDGET_STYLES;
  }

  destroy() {
    if (this.root) {
      this.root.unmount();
    }
    if (this.container) {
      document.body.removeChild(this.container);
    }
  }
}

// Auto-initialize from script tag
(function() {
  const script = document.currentScript as HTMLScriptElement;
  if (!script) return;

  const agentId = script.getAttribute('data-agent-id');
  const position = (script.getAttribute('data-position') || 'bottom-right') as ChatPadWidgetConfig['position'];
  const primaryColor = script.getAttribute('data-primary-color') || undefined;

  if (!agentId) {
    console.error('ChatPad Widget: data-agent-id is required');
    return;
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const widget = new ChatPadWidget({ agentId, position, primaryColor });
      widget.init();
      (window as any).chatpadWidget = widget;
    });
  } else {
    const widget = new ChatPadWidget({ agentId, position, primaryColor });
    widget.init();
    (window as any).chatpadWidget = widget;
  }
})();

export { ChatPadWidget };
