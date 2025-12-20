/**
 * ChatPad Widget - Iframe-Based Loader
 * Loading: "When Idle" mode - loads in background when browser is idle
 */
(function() {
  'use strict';
  
  const SUPABASE_URL = 'https://mvaimvwdukpgvkifkfpa.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12YWltdndkdWtwZ3ZraWZrZnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNzI3MTYsImV4cCI6MjA3Mjc0ODcxNn0.DmeecDZcGids_IjJQQepFVQK5wdEdV0eNXDCTRzQtQo';
  
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
      /* Colors set dynamically via JS based on system theme */
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
    
    /* Close icon (chevron down) - hidden by default */
    .chatpad-widget-button .chatpad-icon-close {
      opacity: 0;
      transform: rotate(0deg) scale(0.5);
    }
    
    /* When widget is open: swap icons with rotation */
    .chatpad-widget-button.chatpad-widget-button-open .chatpad-icon-open {
      opacity: 0;
      transform: rotate(180deg) scale(0.5);
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
      
      .chatpad-widget-iframe {
        border-radius: 0 !important;
      }
      
      .chatpad-widget-button {
        bottom: 20px !important;
        right: 20px !important;
        top: auto !important;
        left: auto !important;
      }
    }
    
    .chatpad-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #ef4444;
      color: white;
      border-radius: 50%;
      min-width: 20px;
      height: 20px;
      font-size: 11px;
      font-weight: 600;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      animation: chatpad-pulse 2s infinite;
    }
    
    .chatpad-badge.visible {
      display: flex;
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
        appUrl: config.appUrl || SUPABASE_URL,
        // Location detection attributes
        wordpressSiteUrl: config.wordpressSiteUrl || null,
        locationSlug: config.locationSlug || null,
      };
      this.isOpen = false;
      this.container = null;
      this.button = null;
      this.iframeContainer = null;
      this.iframe = null;
      // Track if iframe has been created
      this.iframeLoaded = false;
      // Track if widget has signaled ready
      this.widgetReady = false;
      // Cached config from API
      this.cachedConfig = null;
      // Config fetch in progress
      this.configFetching = false;
      // Parent page tracking
      this.currentParentUrl = window.location.href;
      this.parentReferrer = document.referrer;
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
      
      // Create iframe container (but hidden)
      this.createIframeContainer();
      
      // Listen for messages from iframe
      window.addEventListener('message', this.handleMessage.bind(this));
      
      // Listen for parent page navigation to track page visits
      window.addEventListener('popstate', () => this.trackParentNavigation());
      window.addEventListener('hashchange', () => this.trackParentNavigation());
      
      // Preload immediately - bundle was already deferred by loader script
      this.preloadEverything();
    }
    
    injectStyles() {
      const styleEl = document.createElement('style');
      styleEl.textContent = WIDGET_STYLES;
      document.head.appendChild(styleEl);
    }
    
    /**
     * Preload everything when browser is idle
     * This makes click-to-open instant
     */
    preloadEverything() {
      this.addPreconnectHints();
      this.fetchConfig();
      this.createIframe();
    }
    
    /**
     * Fetch widget config from API
     */
    async fetchConfig() {
      if (this.configFetching || this.cachedConfig) return;
      this.configFetching = true;
      
      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/get-widget-config?agentId=${this.config.agentId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
            },
          }
        );
        
        if (response.ok) {
          this.cachedConfig = await response.json();
          
          // If iframe is ready, send config immediately
          if (this.widgetReady && this.iframe?.contentWindow) {
            this.sendConfigToIframe();
          }
        }
      } catch (e) {
        console.warn('ChatPad: Config prefetch failed, will fetch in iframe', e);
      }
    }
    
    /**
     * Send cached config to iframe via postMessage
     */
    sendConfigToIframe() {
      if (this.cachedConfig && this.iframe?.contentWindow) {
        this.iframe.contentWindow.postMessage({
          type: 'chatpad-widget-config',
          config: this.cachedConfig,
        }, '*');
      }
    }
    
    /**
     * Add preconnect hints for faster loading
     */
    addPreconnectHints() {
      // Preconnect to Supabase
      const preconnectApp = document.createElement('link');
      preconnectApp.rel = 'preconnect';
      preconnectApp.href = SUPABASE_URL;
      document.head.appendChild(preconnectApp);
      
      // Preconnect to Google Fonts
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
    
    getSystemTheme() {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    updateButtonTheme(theme) {
      if (!this.button) return;
      
      if (theme === 'dark') {
        // Dark mode: white button, black icon
        this.button.style.background = '#FFFFFF';
        this.button.style.color = '#000000';
      } else {
        // Light mode: black button, white icon
        this.button.style.background = '#000000';
        this.button.style.color = '#FFFFFF';
      }
    }
    
    createButton() {
      this.button = document.createElement('button');
      this.button.className = 'chatpad-widget-button';
      this.button.innerHTML = `
        <svg class="chatpad-icon-open" viewBox="0 0 130.1 154.21" fill="currentColor">
          <path d="M119.03 0H11.07C4.95 0 0 4.95 0 11.07v107.96c0 6.11 4.95 11.07 11.07 11.07l64.98-.1c19.77 0 26.87 7.95 40.85 21.93 4.87 4.87 13.2 1.42 13.2-5.47V11.07C130.1 4.96 125.15 0 119.03 0m-14.78 64.47c0 .58-.47 1.06-1.06 1.06h-4.93c-3.45 0-6.85.54-10.07 1.58-4.89 1.58-7.21 7.05-4.89 11.55 1.53 2.96 3.53 5.69 5.98 8.08l3.46 3.39c.42.42.42 1.1 0 1.51l-.02.02c-.41.4-1.07.4-1.48 0l-3.49-3.42a32.4 32.4 0 0 0-8.26-5.85c-4.6-2.27-10.2 0-11.81 4.78a30.9 30.9 0 0 0-1.62 9.85v4.8c0 .58-.47 1.06-1.06 1.06h-.05c-.58 0-1.06-.47-1.06-1.06v-4.8c0-3.38-.56-6.7-1.62-9.85-1.61-4.79-7.21-7.05-11.81-4.78a32 32 0 0 0-8.26 5.85l-3.49 3.42c-.41.4-1.07.4-1.48 0l-.02-.02c-.42-.42-.42-1.1 0-1.51l3.46-3.39c2.44-2.39 4.45-5.12 5.98-8.08 2.32-4.5 0-9.97-4.89-11.55a32.8 32.8 0 0 0-10.07-1.58h-4.93a1.06 1.06 0 0 1 0-2.12h4.93c3.45 0 6.85-.54 10.07-1.58 4.89-1.58 7.21-7.05 4.89-11.55a31.4 31.4 0 0 0-5.98-8.08l-3.46-3.39c-.42-.42-.42-1.1 0-1.51l.02-.02c.41-.4 1.07-.4 1.48 0l3.49 3.42a32.4 32.4 0 0 0 8.26 5.85c4.6 2.27 10.2 0 11.81-4.78 1.06-3.15 1.62-6.47 1.62-9.85v-4.8c0-.58.47-1.06 1.06-1.06H65c.58 0 1.06.47 1.06 1.06v4.8c0 3.38.56 6.7 1.62 9.85 1.61 4.79 7.21 7.05 11.81 4.78 3.03-1.49 5.82-3.46 8.26-5.85l3.49-3.42c.41-.4 1.07-.4 1.48 0l.02.02c.42.42.42 1.1 0 1.51l-3.46 3.39a31.7 31.7 0 0 0-5.98 8.08c-2.32 4.5 0 9.97 4.89 11.55 3.22 1.04 6.62 1.58 10.07 1.58h4.93c.58 0 1.06.47 1.06 1.06" />
        </svg>
        <svg class="chatpad-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9l6 6 6-6"/>
        </svg>
        <span class="chatpad-badge"></span>
      `;
      
      this.badge = this.button.querySelector('.chatpad-badge');
      
      // Set initial button theme based on system preference
      this.updateButtonTheme(this.getSystemTheme());
      
      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        this.updateButtonTheme(e.matches ? 'dark' : 'light');
      });
      
      this.button.addEventListener('click', () => this.toggle());
      this.container.appendChild(this.button);
    }
    
    /**
     * Create iframe container without the iframe itself
     */
    createIframeContainer() {
      this.iframeContainer = document.createElement('div');
      this.iframeContainer.className = 'chatpad-widget-iframe-container hidden';
      this.container.appendChild(this.iframeContainer);
    }
    
    /**
     * Create and load the iframe
     */
    createIframe() {
      if (this.iframeLoaded) return;
      this.iframeLoaded = true;
      
      // Build iframe URL with config params including location detection
      const params = new URLSearchParams({
        agentId: this.config.agentId,
        position: this.config.position,
        primaryColor: this.config.primaryColor,
      });
      
      // Add optional location params
      if (this.config.wordpressSiteUrl) {
        params.set('wpSite', this.config.wordpressSiteUrl);
      }
      if (this.config.locationSlug) {
        params.set('location', this.config.locationSlug);
      }
      
      this.iframe = document.createElement('iframe');
      this.iframe.className = 'chatpad-widget-iframe';
      // Use widget.html for optimized widget bundle
      this.iframe.src = `${this.config.appUrl}/widget.html?${params.toString()}`;
      this.iframe.allow = 'microphone; camera';
      this.iframe.title = 'Chat Widget';
      
      this.iframeContainer.appendChild(this.iframe);
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
     * Show the iframe container (instant since everything is preloaded)
     */
    showContainer() {
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
      this.showContainer();
      // Clear unread badge when opening
      this.updateUnreadBadge(0);
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
          // Widget iframe is ready, send cached config if available
          this.widgetReady = true;
          if (this.cachedConfig) {
            this.sendConfigToIframe();
          }
          // Send initial parent page info
          this.sendParentPageInfo();
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
          
        case 'chatpad-unread-count':
          this.updateUnreadBadge(event.data.count);
          break;
      }
    }
    
    /**
     * Send parent page info to iframe for accurate page tracking
     */
    sendParentPageInfo() {
      if (!this.iframe?.contentWindow) return;
      
      // Extract UTM parameters from parent URL
      let utmParams = {};
      try {
        const url = new URL(this.currentParentUrl);
        utmParams = {
          utm_source: url.searchParams.get('utm_source'),
          utm_medium: url.searchParams.get('utm_medium'),
          utm_campaign: url.searchParams.get('utm_campaign'),
          utm_term: url.searchParams.get('utm_term'),
          utm_content: url.searchParams.get('utm_content'),
        };
      } catch (e) { /* ignore */ }
      
      this.iframe.contentWindow.postMessage({
        type: 'chatpad-parent-page-info',
        url: this.currentParentUrl,
        referrer: this.parentReferrer,
        utmParams: utmParams,
      }, '*');
    }
    
    /**
     * Track parent page navigation and send to iframe
     */
    trackParentNavigation() {
      const newUrl = window.location.href;
      if (newUrl !== this.currentParentUrl) {
        this.currentParentUrl = newUrl;
        this.sendParentPageInfo();
      }
    }
    
    updateUnreadBadge(count) {
      if (!this.badge) return;
      
      if (count > 0 && !this.isOpen) {
        this.badge.textContent = count > 9 ? '9+' : count.toString();
        this.badge.classList.add('visible');
      } else {
        this.badge.classList.remove('visible');
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
      appUrl: currentScript.getAttribute('data-app-url') || SUPABASE_URL,
      // Location detection attributes
      wordpressSiteUrl: currentScript.getAttribute('data-wordpress-site') || null,
      locationSlug: currentScript.getAttribute('data-location') || null,
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
