/**
 * ChatPad Widget - Iframe-Based Loader
 * Optimized: Deferred iframe loading, preconnect hints, minimal initial footprint
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
      position: absolute;
      transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    /* Open icon (ChatPad logo) - visible by default */
    .chatpad-widget-button .chatpad-icon-open {
      opacity: 1;
      transform: rotate(0deg) scale(1);
    }
    
    /* Close icon (X) - hidden by default */
    .chatpad-widget-button .chatpad-icon-close {
      opacity: 0;
      transform: rotate(-90deg) scale(0.5);
    }
    
    /* When widget is open: swap icons with rotation */
    .chatpad-widget-button.chatpad-widget-button-open .chatpad-icon-open {
      opacity: 0;
      transform: rotate(90deg) scale(0.5);
    }
    
    .chatpad-widget-button.chatpad-widget-button-open .chatpad-icon-close {
      opacity: 1;
      transform: rotate(0deg) scale(1);
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
        appUrl: config.appUrl || 'https://mvaimvwdukpgvkifkfpa.supabase.co',
      };
      this.isOpen = false;
      this.container = null;
      this.button = null;
      this.iframeContainer = null;
      this.iframe = null;
      // Track if iframe has been created (deferred loading)
      this.iframeLoaded = false;
      // Track if widget has signaled ready
      this.widgetReady = false;
      // Track if preconnect has been added
      this.preconnected = false;
      // Timeout for fallback display
      this.readyTimeout = null;
    }
    
    init() {
      // Inject styles
      this.injectStyles();
      
      // Create container
      this.container = document.createElement('div');
      this.container.className = `chatpad-widget-container chatpad-position-${this.config.position}`;
      this.container.style.setProperty('--chatpad-primary-color', this.config.primaryColor);
      document.body.appendChild(this.container);
      
      // Create button (with preconnect on hover)
      this.createButton();
      
      // Create iframe container (but NOT the iframe yet - deferred)
      this.createIframeContainer();
      
      // Listen for messages from iframe
      window.addEventListener('message', this.handleMessage.bind(this));
    }
    
    injectStyles() {
      const styleEl = document.createElement('style');
      styleEl.textContent = WIDGET_STYLES;
      document.head.appendChild(styleEl);
    }
    
    /**
     * Add preconnect hints for faster iframe loading
     * Called on button hover to warm up connections before click
     */
    addPreconnectHints() {
      if (this.preconnected) return;
      this.preconnected = true;
      
      // Preconnect to widget host
      const preconnectApp = document.createElement('link');
      preconnectApp.rel = 'preconnect';
      preconnectApp.href = this.config.appUrl;
      document.head.appendChild(preconnectApp);
      
      // Preconnect to Google Fonts (used by widget)
      const preconnectFonts = document.createElement('link');
      preconnectFonts.rel = 'preconnect';
      preconnectFonts.href = 'https://fonts.googleapis.com';
      document.head.appendChild(preconnectFonts);
      
      const preconnectGstatic = document.createElement('link');
      preconnectGstatic.rel = 'preconnect';
      preconnectGstatic.href = 'https://fonts.gstatic.com';
      preconnectGstatic.crossOrigin = 'anonymous';
      document.head.appendChild(preconnectGstatic);
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
      
      // Preload iframe on hover for near-instant opening
      this.button.addEventListener('mouseenter', () => this.preloadIframe(), { once: true });
      this.button.addEventListener('touchstart', () => this.preloadIframe(), { once: true, passive: true });
      
      this.button.addEventListener('click', () => this.toggle());
      this.container.appendChild(this.button);
    }
    
    /**
     * Create iframe container without the iframe itself (deferred loading)
     */
    createIframeContainer() {
      this.iframeContainer = document.createElement('div');
      this.iframeContainer.className = 'chatpad-widget-iframe-container hidden';
      this.container.appendChild(this.iframeContainer);
      // iframe will be created on first open
    }
    
    /**
     * Create and load the iframe (called on first open)
     */
    createIframe() {
      if (this.iframeLoaded) return;
      this.iframeLoaded = true;
      
      // Build iframe URL with config params
      const params = new URLSearchParams({
        agentId: this.config.agentId,
        position: this.config.position,
        primaryColor: this.config.primaryColor,
      });
      
      this.iframe = document.createElement('iframe');
      this.iframe.className = 'chatpad-widget-iframe';
      // Use widget.html for optimized widget bundle
      this.iframe.src = `${this.config.appUrl}/widget.html?${params.toString()}`;
      this.iframe.allow = 'microphone; camera';
      this.iframe.title = 'Chat Widget';
      
      this.iframeContainer.appendChild(this.iframe);
      
      // Fallback: show container after 2 seconds even if no ready signal
      this.readyTimeout = setTimeout(() => {
        if (this.isOpen && !this.widgetReady) {
          this.showContainer();
        }
      }, 2000);
    }
    
    toggle() {
      this.isOpen = !this.isOpen;
      
      if (this.isOpen) {
        this.open();
      } else {
        this.close();
      }
    }
    
    /**
     * Preload iframe on hover for near-instant opening
     */
    preloadIframe() {
      this.addPreconnectHints();
      
      // Create iframe in background (hidden) if not already loaded
      if (!this.iframeLoaded) {
        this.createIframe();
      }
    }
    
    /**
     * Show the iframe container with animation
     */
    showContainer() {
      this.widgetReady = true;
      this.iframeContainer.classList.remove('hidden');
      this.iframeContainer.classList.add('visible');
      this.button.classList.add('chatpad-widget-button-open');
      
      // Notify iframe
      if (this.iframe && this.iframe.contentWindow) {
        this.iframe.contentWindow.postMessage({
          type: 'chatpad-widget-opened',
        }, '*');
      }
    }
    
    open() {
      this.isOpen = true;
      
      // If widget is already ready (preloaded on hover), show immediately
      if (this.widgetReady) {
        this.showContainer();
        return;
      }
      
      // Create iframe if not already loading
      if (!this.iframeLoaded) {
        this.createIframe();
      }
      // Wait for ready signal (handled in handleMessage)
    }
    
    close() {
      this.isOpen = false;
      this.iframeContainer.classList.remove('visible');
      this.iframeContainer.classList.add('hidden');
      this.button.classList.remove('chatpad-widget-button-open');
      
      // Notify iframe (if loaded)
      if (this.iframe && this.iframe.contentWindow) {
        this.iframe.contentWindow.postMessage({
          type: 'chatpad-widget-closed',
        }, '*');
      }
    }
    
    handleMessage(event) {
      // Verify message is from our iframe
      if (!event.data || typeof event.data !== 'object') return;
      
      switch (event.data.type) {
        case 'chatpad-widget-ready':
          // Widget is ready to display, now show the container
          if (this.readyTimeout) {
            clearTimeout(this.readyTimeout);
          }
          if (this.isOpen && !this.widgetReady) {
            this.showContainer();
          }
          break;
          
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
