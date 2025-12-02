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
      position: fixed;
      width: 50px;
      height: 50px;
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
    
    .chatpad-widget-button .chatpad-icon-close {
      display: none;
    }
    
    .chatpad-widget-button.chatpad-widget-button-open .chatpad-icon-open {
      display: none;
    }
    
    .chatpad-widget-button.chatpad-widget-button-open .chatpad-icon-close {
      display: block;
    }
    
    .chatpad-widget-iframe-container {
      position: fixed;
      z-index: 999998;
      background: transparent;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 24px;
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
      background: transparent;
      border-radius: 24px;
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
        appUrl: config.appUrl || 'https://app.pad.chat',
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
        <svg class="chatpad-icon-open" viewBox="0 0 270.69 270.02" fill="currentColor">
          <g>
            <path d="M135.35,0C60.59,0,0,60.44,0,135.02s60.59,135,135.35,135,135.35-60.44,135.35-135S210.1,0,135.35,0ZM135.35,241.44c-58.96,0-106.7-47.62-106.7-106.43S76.38,28.57,135.35,28.57s106.7,47.63,106.7,106.44-47.74,106.43-106.7,106.43Z" />
            <path d="M86.78,166.62c9.45,48.43,79.49,46.38,94.14,9.97,3.46-8.6,8.57-27.67-15.49-17.93-22.19,9.02-53.36,37.06-78.66,7.96h.01Z" />
          </g>
        </svg>
        <svg class="chatpad-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
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
      this.button.classList.add('chatpad-widget-button-open');
      
      // Notify iframe
      this.iframe.contentWindow?.postMessage({
        type: 'chatpad-widget-opened',
      }, '*');
    }
    
    close() {
      this.isOpen = false;
      this.iframeContainer.classList.remove('visible');
      this.iframeContainer.classList.add('hidden');
      this.button.classList.remove('chatpad-widget-button-open');
      
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
      appUrl: currentScript.getAttribute('data-app-url') || 'https://app.pad.chat',
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
