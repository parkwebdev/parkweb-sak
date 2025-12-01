/**
 * ChatPad Widget - Iframe-Based Loader
 * This script creates a chat button and loads the full widget in an iframe
 */
(function() {
  'use strict';
  
  const WIDGET_STYLES = `
    .chatpad-widget-container {
      position: fixed;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    
    .chatpad-widget-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: var(--chatpad-primary-color);
      color: white;
    }
    
    .chatpad-widget-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    }
    
    .chatpad-widget-button svg {
      width: 28px;
      height: 28px;
    }
    
    .chatpad-widget-iframe-container {
      position: fixed;
      z-index: 999998;
      background: transparent;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    }
    
    .chatpad-widget-iframe-container.hidden {
      opacity: 0;
      pointer-events: none;
      transform: translateY(20px) scale(0.95);
    }
    
    .chatpad-widget-iframe-container.visible {
      opacity: 1;
      pointer-events: all;
      transform: translateY(0) scale(1);
    }
    
    .chatpad-widget-iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: white;
    }
    
    /* Position variants */
    .chatpad-position-bottom-right .chatpad-widget-button {
      bottom: 24px;
      right: 24px;
    }
    
    .chatpad-position-bottom-right .chatpad-widget-iframe-container {
      bottom: 100px;
      right: 24px;
      width: 400px;
      height: 650px;
      max-height: calc(100vh - 120px);
    }
    
    .chatpad-position-bottom-left .chatpad-widget-button {
      bottom: 24px;
      left: 24px;
    }
    
    .chatpad-position-bottom-left .chatpad-widget-iframe-container {
      bottom: 100px;
      left: 24px;
      width: 400px;
      height: 650px;
      max-height: calc(100vh - 120px);
    }
    
    .chatpad-position-top-right .chatpad-widget-button {
      top: 24px;
      right: 24px;
    }
    
    .chatpad-position-top-right .chatpad-widget-iframe-container {
      top: 100px;
      right: 24px;
      width: 400px;
      height: 650px;
      max-height: calc(100vh - 120px);
    }
    
    .chatpad-position-top-left .chatpad-widget-button {
      top: 24px;
      left: 24px;
    }
    
    .chatpad-position-top-left .chatpad-widget-iframe-container {
      top: 100px;
      left: 24px;
      width: 400px;
      height: 650px;
      max-height: calc(100vh - 120px);
    }
    
    /* Mobile responsive */
    @media (max-width: 480px) {
      .chatpad-widget-iframe-container {
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: 100% !important;
        max-height: 100vh !important;
        border-radius: 0 !important;
      }
      
      .chatpad-widget-button {
        bottom: 20px !important;
        right: 20px !important;
        top: auto !important;
        left: auto !important;
      }
    }
    
    /* Badge animation */
    .chatpad-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #ef4444;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      font-size: 11px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: chatpad-pulse 2s infinite;
    }
    
    @keyframes chatpad-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  `;
  
  class ChatPadWidget {
    constructor(config) {
      this.config = {
        agentId: config.agentId,
        position: config.position || 'bottom-right',
        primaryColor: config.primaryColor || '#3b82f6',
        appUrl: config.appUrl || 'https://mvaimvwdukpgvkifkfpa.supabase.co',
      };
      this.isOpen = false;
      this.container = null;
      this.button = null;
      this.iframeContainer = null;
      this.iframe = null;
    }
    
    init() {
      // Inject styles
      this.injectStyles();
      
      // Create container
      this.container = document.createElement('div');
      this.container.className = `chatpad-widget-container chatpad-position-${this.config.position}`;
      this.container.style.setProperty('--chatpad-primary-color', this.config.primaryColor);
      document.body.appendChild(this.container);
      
      // Create button
      this.createButton();
      
      // Create iframe container
      this.createIframeContainer();
      
      // Listen for messages from iframe
      window.addEventListener('message', this.handleMessage.bind(this));
    }
    
    injectStyles() {
      const styleEl = document.createElement('style');
      styleEl.textContent = WIDGET_STYLES;
      document.head.appendChild(styleEl);
    }
    
    createButton() {
      this.button = document.createElement('button');
      this.button.className = 'chatpad-widget-button';
      this.button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
      this.button.addEventListener('click', () => this.toggle());
      this.container.appendChild(this.button);
    }
    
    createIframeContainer() {
      this.iframeContainer = document.createElement('div');
      this.iframeContainer.className = 'chatpad-widget-iframe-container hidden';
      
      // Build iframe URL with config params
      const params = new URLSearchParams({
        agentId: this.config.agentId,
        position: this.config.position,
        primaryColor: this.config.primaryColor,
      });
      
      this.iframe = document.createElement('iframe');
      this.iframe.className = 'chatpad-widget-iframe';
      this.iframe.src = `${this.config.appUrl}/widget?${params.toString()}`;
      this.iframe.allow = 'microphone; camera';
      this.iframe.title = 'Chat Widget';
      
      this.iframeContainer.appendChild(this.iframe);
      this.container.appendChild(this.iframeContainer);
    }
    
    toggle() {
      this.isOpen = !this.isOpen;
      
      if (this.isOpen) {
        this.open();
      } else {
        this.close();
      }
    }
    
    open() {
      this.isOpen = true;
      this.iframeContainer.classList.remove('hidden');
      this.iframeContainer.classList.add('visible');
      this.button.style.display = 'none';
      
      // Notify iframe
      this.iframe.contentWindow?.postMessage({
        type: 'chatpad-widget-opened',
      }, '*');
    }
    
    close() {
      this.isOpen = false;
      this.iframeContainer.classList.remove('visible');
      this.iframeContainer.classList.add('hidden');
      this.button.style.display = 'flex';
      
      // Notify iframe
      this.iframe.contentWindow?.postMessage({
        type: 'chatpad-widget-closed',
      }, '*');
    }
    
    handleMessage(event) {
      // Verify message is from our iframe
      if (!event.data || typeof event.data !== 'object') return;
      
      switch (event.data.type) {
        case 'chatpad-widget-close':
          this.close();
          break;
        
        case 'chatpad-widget-open':
          this.open();
          break;
          
        case 'chatpad-widget-state':
          if (event.data.isOpen !== undefined) {
            if (event.data.isOpen && !this.isOpen) {
              this.open();
            } else if (!event.data.isOpen && this.isOpen) {
              this.close();
            }
          }
          break;
          
        case 'chatpad-widget-resize':
          if (event.data.height) {
            this.iframeContainer.style.height = `${Math.min(event.data.height, window.innerHeight - 120)}px`;
          }
          break;
      }
    }
    
    destroy() {
      window.removeEventListener('message', this.handleMessage.bind(this));
      if (this.container) {
        this.container.remove();
      }
    }
  }
  
  // Auto-initialize from script tag
  const currentScript = document.currentScript;
  if (currentScript && currentScript.hasAttribute('data-agent-id')) {
    const config = {
      agentId: currentScript.getAttribute('data-agent-id'),
      position: currentScript.getAttribute('data-position') || 'bottom-right',
      primaryColor: currentScript.getAttribute('data-primary-color') || '#3b82f6',
      appUrl: currentScript.getAttribute('data-app-url') || 'https://mvaimvwdukpgvkifkfpa.supabase.co',
    };
    
    const widget = new ChatPadWidget(config);
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => widget.init());
    } else {
      widget.init();
    }
  }
  
  // Export for manual instantiation
  window.ChatPadWidget = ChatPadWidget;
})();
