/**
 * ChatPad Widget Bundle
 * This is a pre-built development version. Production builds will be auto-generated.
 */
(function() {
  'use strict';
  
  // Widget styles
  const WIDGET_STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    :host {
      --primary: 222.2 47.4% 11.2%;
      --primary-foreground: 210 40% 98%;
      --secondary: 210 40% 96.1%;
      --secondary-foreground: 222.2 47.4% 11.2%;
      --muted: 210 40% 96.1%;
      --muted-foreground: 215.4 16.3% 46.9%;
      --accent: 210 40% 96.1%;
      --accent-foreground: 222.2 47.4% 11.2%;
      --destructive: 0 84.2% 60.2%;
      --destructive-foreground: 210 40% 98%;
      --border: 214.3 31.8% 91.4%;
      --input: 214.3 31.8% 91.4%;
      --ring: 222.2 84% 4.9%;
      --radius: 0.5rem;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    .widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: 'Inter', sans-serif;
    }
    
    .widget-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .widget-button:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
    
    .widget-window {
      position: fixed;
      bottom: 100px;
      right: 20px;
      width: 400px;
      height: 600px;
      max-height: calc(100vh - 120px);
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .widget-header {
      padding: 16px;
      background: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .widget-title {
      font-size: 16px;
      font-weight: 600;
    }
    
    .widget-close {
      background: transparent;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .widget-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: hsl(var(--secondary));
    }
    
    .widget-input-area {
      padding: 16px;
      border-top: 1px solid hsl(var(--border));
      background: white;
    }
    
    .widget-input {
      width: 100%;
      padding: 12px;
      border: 1px solid hsl(var(--border));
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
    }
    
    .widget-input:focus {
      outline: none;
      border-color: hsl(var(--ring));
    }
    
    .message {
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
    }
    
    .message-user {
      align-items: flex-end;
    }
    
    .message-assistant {
      align-items: flex-start;
    }
    
    .message-bubble {
      padding: 10px 14px;
      border-radius: 12px;
      max-width: 80%;
      word-wrap: break-word;
    }
    
    .message-user .message-bubble {
      background: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
    }
    
    .message-assistant .message-bubble {
      background: white;
      color: hsl(var(--primary));
    }
    
    @media (max-width: 480px) {
      .widget-window {
        width: calc(100vw - 40px);
        height: calc(100vh - 120px);
        right: 20px;
        left: 20px;
      }
    }
  `;
  
  class ChatPadWidget {
    constructor(config) {
      this.config = {
        agentId: config.agentId,
        position: config.position || 'bottom-right',
        primaryColor: config.primaryColor || '#000000',
      };
      this.container = null;
      this.shadowRoot = null;
    }
    
    init() {
      // Create container
      this.container = document.createElement('div');
      this.container.id = 'chatpad-widget-root';
      document.body.appendChild(this.container);
      
      // Create shadow DOM for style isolation
      this.shadowRoot = this.container.attachShadow({ mode: 'open' });
      
      // Inject styles
      const styleEl = document.createElement('style');
      styleEl.textContent = WIDGET_STYLES;
      this.shadowRoot.appendChild(styleEl);
      
      // Create widget mount point
      const mountPoint = document.createElement('div');
      this.shadowRoot.appendChild(mountPoint);
      
      // Render widget
      this.render(mountPoint);
    }
    
    render(mountPoint) {
      // Simple widget implementation
      const widgetHTML = `
        <div class="widget-container">
          <button class="widget-button" id="widget-toggle">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
          <div class="widget-window" id="widget-window" style="display: none;">
            <div class="widget-header">
              <div class="widget-title">Chat Support</div>
              <button class="widget-close" id="widget-close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="widget-content" id="widget-messages">
              <div class="message message-assistant">
                <div class="message-bubble">Hello! How can I help you today?</div>
              </div>
            </div>
            <div class="widget-input-area">
              <input type="text" class="widget-input" id="widget-input" placeholder="Type your message..." />
            </div>
          </div>
        </div>
      `;
      
      mountPoint.innerHTML = widgetHTML;
      
      // Add event listeners
      const toggleBtn = mountPoint.querySelector('#widget-toggle');
      const closeBtn = mountPoint.querySelector('#widget-close');
      const widgetWindow = mountPoint.querySelector('#widget-window');
      const input = mountPoint.querySelector('#widget-input');
      const messagesContainer = mountPoint.querySelector('#widget-messages');
      
      toggleBtn.addEventListener('click', () => {
        widgetWindow.style.display = widgetWindow.style.display === 'none' ? 'flex' : 'none';
      });
      
      closeBtn.addEventListener('click', () => {
        widgetWindow.style.display = 'none';
      });
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && input.value.trim()) {
          const message = input.value.trim();
          
          // Add user message
          const userMsg = document.createElement('div');
          userMsg.className = 'message message-user';
          userMsg.innerHTML = `<div class="message-bubble">${message}</div>`;
          messagesContainer.appendChild(userMsg);
          
          input.value = '';
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
          
          // Simulate response
          setTimeout(() => {
            const botMsg = document.createElement('div');
            botMsg.className = 'message message-assistant';
            botMsg.innerHTML = `<div class="message-bubble">Thanks for your message! This is a demo response.</div>`;
            messagesContainer.appendChild(botMsg);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }, 1000);
        }
      });
    }
    
    destroy() {
      if (this.container) {
        this.container.remove();
        this.container = null;
        this.shadowRoot = null;
      }
    }
  }
  
  // Auto-initialize from script tag
  const currentScript = document.currentScript;
  if (currentScript && currentScript.hasAttribute('data-agent-id')) {
    const config = {
      agentId: currentScript.getAttribute('data-agent-id'),
      position: currentScript.getAttribute('data-position') || 'bottom-right',
      primaryColor: currentScript.getAttribute('data-primary-color') || '#000000',
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
