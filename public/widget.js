(function() {
  'use strict';

  // Configuration
  const script = document.currentScript;
  const agentId = script.getAttribute('data-agent-id');
  const position = script.getAttribute('data-position') || 'bottom-right';
  const primaryColor = script.getAttribute('data-primary-color') || '#6366f1';

  if (!agentId) {
    console.error('ChatPad Agent: data-agent-id is required');
    return;
  }

  const API_URL = 'https://mvaimvwdukpgvkifkfpa.supabase.co/functions/v1';
  
  let config = null;
  let currentView = 'home';
  let messages = [];
  let conversationId = null;
  let isTyping = false;
  let selectedFiles = [];
  let leadCaptured = false;
  let showSettingsDropdown = false;

  // Settings state with localStorage
  let chatSettings = {
    soundEnabled: true,
    autoScroll: true
  };

  // Load settings from localStorage
  function loadSettings() {
    const saved = localStorage.getItem(`chatpad_settings_${agentId}`);
    if (saved) {
      chatSettings = JSON.parse(saved);
    }
  }

  // Save settings to localStorage
  function saveSettings() {
    localStorage.setItem(`chatpad_settings_${agentId}`, JSON.stringify(chatSettings));
  }

  // Check localStorage for returning user
  const storedLead = localStorage.getItem(`chatpad_lead_${agentId}`);
  if (storedLead) {
    leadCaptured = true;
  }

  // Inject dynamic styles
  function injectStyles() {
    const positionStyles = {
      'bottom-right': 'bottom: 24px; right: 24px;',
      'bottom-left': 'bottom: 24px; left: 24px;',
      'top-right': 'top: 24px; right: 24px;',
      'top-left': 'top: 24px; left: 24px;'
    };

    const animationKeyframes = `
      @keyframes chatpad-pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes chatpad-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
      @keyframes chatpad-fade {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      @keyframes chatpad-ring {
        0% { transform: scale(1); box-shadow: 0 0 0 0 ${primaryColor}40; }
        50% { transform: scale(1.02); box-shadow: 0 0 0 8px ${primaryColor}20; }
        100% { transform: scale(1); box-shadow: 0 0 0 0 ${primaryColor}00; }
      }
      @keyframes chatpad-slide-up {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes chatpad-slide-left {
        from { transform: translateX(20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes chatpad-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes chatpad-typing {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-4px); }
      }
      @keyframes chatpad-gradient-shift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
    `;

    const styles = `
      ${animationKeyframes}
      
      .chatpad-widget-container {
        position: fixed;
        ${positionStyles[position]}
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }

      .chatpad-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${primaryColor};
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
        position: relative;
      }

      .chatpad-button:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
      }

      .chatpad-button.animate-pulse {
        animation: chatpad-pulse 2s ease-in-out infinite;
      }

      .chatpad-button.animate-bounce {
        animation: chatpad-bounce 2s ease-in-out infinite;
      }

      .chatpad-button.animate-ring {
        animation: chatpad-ring 2s ease-in-out infinite;
      }

      .chatpad-button-icon {
        width: 28px;
        height: 28px;
        color: white;
      }

      .chatpad-badge {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 12px;
        height: 12px;
        background: #22c55e;
        border: 2px solid white;
        border-radius: 50%;
      }

      .chatpad-teaser {
        position: absolute;
        ${position.includes('right') ? 'right: 70px;' : 'left: 70px;'}
        ${position.includes('bottom') ? 'bottom: 15px;' : 'top: 15px;'}
        background: white;
        padding: 12px 16px;
        border-radius: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        max-width: 200px;
        animation: chatpad-slide-left 0.3s ease-out;
        cursor: pointer;
      }

      .chatpad-teaser-text {
        font-size: 14px;
        color: #1f2937;
        margin: 0;
      }

      .chatpad-window {
        position: fixed;
        ${positionStyles[position]}
        width: 400px;
        height: 600px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: chatpad-slide-up 0.3s ease-out;
      }

      /* Hero Header for Home View */
      .chatpad-hero-header {
        position: relative;
        height: 180px;
        background: linear-gradient(135deg, ${config?.gradientStartColor || primaryColor} 0%, ${config?.gradientEndColor || primaryColor} 100%);
        background-size: 200% 200%;
        animation: chatpad-gradient-shift 8s ease infinite;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        overflow: hidden;
      }

      .chatpad-hero-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 60%);
        pointer-events: none;
      }

      .chatpad-hero-content {
        position: relative;
        z-index: 2;
        text-align: center;
        padding: 20px;
      }

      .chatpad-hero-emoji {
        font-size: 48px;
        margin-bottom: 12px;
        display: block;
      }

      .chatpad-hero-title {
        font-size: 24px;
        font-weight: 600;
        margin: 0 0 8px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .chatpad-hero-subtitle {
        font-size: 14px;
        opacity: 0.95;
        margin: 0;
      }

      .chatpad-hero-buttons {
        position: absolute;
        top: 16px;
        right: 16px;
        display: flex;
        gap: 8px;
        z-index: 3;
      }

      .chatpad-header-button {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        backdrop-filter: blur(8px);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        transition: background 0.2s;
      }

      .chatpad-header-button:hover {
        background: rgba(255,255,255,0.3);
      }

      .chatpad-header-button svg {
        width: 20px;
        height: 20px;
      }

      /* Compact Header for Messages/Help Views */
      .chatpad-compact-header {
        padding: 16px 20px;
        background: ${primaryColor};
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .chatpad-compact-header-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .chatpad-compact-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      }

      .chatpad-compact-avatar img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      .chatpad-compact-title {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
      }

      .chatpad-compact-status {
        font-size: 12px;
        opacity: 0.9;
        margin: 2px 0 0;
      }

      /* Settings Dropdown */
      .chatpad-settings-dropdown {
        position: absolute;
        top: 60px;
        right: 16px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        padding: 8px;
        min-width: 200px;
        z-index: 10;
        animation: chatpad-fade-in 0.2s ease-out;
      }

      .chatpad-settings-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .chatpad-settings-item:hover {
        background: #f3f4f6;
      }

      .chatpad-settings-label {
        font-size: 14px;
        color: #1f2937;
        font-weight: 500;
      }

      .chatpad-toggle {
        position: relative;
        width: 40px;
        height: 22px;
        background: #d1d5db;
        border-radius: 11px;
        transition: background 0.2s;
      }

      .chatpad-toggle.active {
        background: ${primaryColor};
      }

      .chatpad-toggle-handle {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 18px;
        height: 18px;
        background: white;
        border-radius: 50%;
        transition: transform 0.2s;
      }

      .chatpad-toggle.active .chatpad-toggle-handle {
        transform: translateX(18px);
      }

      .chatpad-content {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }

      /* Home View */
      .chatpad-home {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      /* Announcements */
      .chatpad-announcement {
        background: linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}08 100%);
        border: 1px solid ${primaryColor}30;
        border-radius: 12px;
        padding: 16px;
        display: flex;
        gap: 12px;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s;
        animation: chatpad-fade-in 0.3s ease-out;
      }

      .chatpad-announcement:hover {
        transform: translateX(4px);
        border-color: ${primaryColor}50;
      }

      .chatpad-announcement-image {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        object-fit: cover;
        flex-shrink: 0;
      }

      .chatpad-announcement-content {
        flex: 1;
      }

      .chatpad-announcement h4 {
        margin: 0 0 4px;
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
      }

      .chatpad-announcement p {
        margin: 0;
        font-size: 13px;
        color: #4b5563;
      }

      .chatpad-announcement-arrow {
        color: #9ca3af;
        font-size: 20px;
      }

      /* Quick Actions - List Style */
      .chatpad-quick-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .chatpad-quick-action {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 16px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .chatpad-quick-action:hover {
        background: #f9fafb;
        border-color: ${primaryColor};
        transform: translateX(4px);
      }

      .chatpad-quick-action-icon-wrapper {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        background: ${primaryColor}15;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .chatpad-quick-action-icon {
        width: 24px;
        height: 24px;
        color: ${primaryColor};
      }

      .chatpad-quick-action-content {
        flex: 1;
      }

      .chatpad-quick-action-title {
        font-size: 15px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 4px;
      }

      .chatpad-quick-action-subtitle {
        font-size: 13px;
        color: #6b7280;
        margin: 0;
      }

      .chatpad-quick-action-arrow {
        color: #9ca3af;
        font-size: 20px;
        transition: transform 0.2s;
      }

      .chatpad-quick-action:hover .chatpad-quick-action-arrow {
        transform: translateX(4px);
      }

      /* Messages View */
      .chatpad-messages {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .chatpad-message {
        display: flex;
        gap: 8px;
        animation: chatpad-fade-in 0.3s ease-out;
      }

      .chatpad-message.user {
        flex-direction: row-reverse;
      }

      .chatpad-message-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: ${primaryColor}20;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .chatpad-message-avatar img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      .chatpad-message-content {
        max-width: 70%;
      }

      .chatpad-message-bubble {
        background: #f3f4f6;
        color: #1f2937;
        padding: 12px 16px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.5;
      }

      .chatpad-message.user .chatpad-message-bubble {
        background: ${primaryColor};
        color: white;
      }

      .chatpad-message-time {
        font-size: 11px;
        color: #9ca3af;
        margin-top: 4px;
        padding: 0 4px;
      }

      .chatpad-typing {
        display: flex;
        gap: 4px;
        padding: 12px 16px;
      }

      .chatpad-typing-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #9ca3af;
        animation: chatpad-typing 1.4s ease-in-out infinite;
      }

      .chatpad-typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }

      .chatpad-typing-dot:nth-child(3) {
        animation-delay: 0.4s;
      }

      /* Help View */
      .chatpad-help {
        padding: 20px;
        overflow-y: auto;
      }

      .chatpad-help-search {
        margin-bottom: 20px;
      }

      .chatpad-help-search input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
      }

      .chatpad-help-search input:focus {
        border-color: ${primaryColor};
      }

      .chatpad-help-category {
        margin-bottom: 24px;
      }

      .chatpad-help-category-title {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 12px;
      }

      .chatpad-help-article {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .chatpad-help-article:hover {
        background: #f3f4f6;
        border-color: ${primaryColor};
      }

      .chatpad-help-article-icon {
        font-size: 20px;
      }

      .chatpad-help-article-title {
        flex: 1;
        font-size: 14px;
        font-weight: 500;
        color: #1f2937;
      }

      /* Input Area */
      .chatpad-input-container {
        padding: 16px 20px;
        border-top: 1px solid #e5e7eb;
        background: white;
      }

      .chatpad-input-wrapper {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .chatpad-input {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid #e5e7eb;
        border-radius: 24px;
        font-size: 14px;
        outline: none;
        font-family: inherit;
      }

      .chatpad-input:focus {
        border-color: ${primaryColor};
      }

      .chatpad-send-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: ${primaryColor};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        transition: transform 0.2s;
      }

      .chatpad-send-button:hover {
        transform: scale(1.05);
      }

      .chatpad-send-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Bottom Navigation */
      .chatpad-bottom-nav {
        display: flex;
        border-top: 1px solid #e5e7eb;
        background: white;
      }

      .chatpad-nav-item {
        flex: 1;
        padding: 12px;
        border: none;
        background: none;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        color: #9ca3af;
        transition: color 0.2s;
      }

      .chatpad-nav-item.active {
        color: ${primaryColor};
      }

      .chatpad-nav-item:hover {
        color: ${primaryColor};
      }

      .chatpad-nav-icon {
        width: 24px;
        height: 24px;
      }

      .chatpad-nav-label {
        font-size: 11px;
        font-weight: 500;
      }

      /* Branding */
      .chatpad-branding {
        text-align: center;
        padding: 12px;
        font-size: 11px;
        color: #9ca3af;
        border-top: 1px solid #e5e7eb;
      }

      .chatpad-branding a {
        color: ${primaryColor};
        text-decoration: none;
      }

      @media (max-width: 480px) {
        .chatpad-window {
          width: 100vw;
          height: 100vh;
          border-radius: 0;
          top: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          left: 0 !important;
        }
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  // SVG Icons
  const icons = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
    help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    minimize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M12 1v6m0 6v6m5.66-14.66L14 8m-4 4-3.66 3.66M23 12h-6m-6 0H1m14.66 5.66L14 16m-4-4-3.66-3.66"></path></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>'
  };

  // Format timestamp
  function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Get icon emoji
  function getIconEmoji(icon) {
    const emojiMap = {
      'chat': '💬',
      'help': '📚',
      'bug': '🐛',
      'feature': '✨',
      'contact': '📧',
      'question': '❓',
      'feedback': '💭'
    };
    return emojiMap[icon] || '💬';
  }

  // Render Hero Header (Home View)
  function renderHeroHeader() {
    const welcomeTitle = config.welcomeTitle || 'Welcome!';
    const welcomeMessage = config.welcomeMessage || 'How can we help you today?';
    const welcomeEmoji = config.welcomeEmoji || '👋';

    return `
      <div class="chatpad-hero-header">
        <div class="chatpad-hero-buttons">
          <button class="chatpad-header-button" onclick="window.chatpadWidget.toggleSettings()" title="Settings">
            ${icons.settings}
          </button>
          <button class="chatpad-header-button" onclick="window.chatpadWidget.minimize()" title="Minimize">
            ${icons.minimize}
          </button>
          <button class="chatpad-header-button" onclick="window.chatpadWidget.close()" title="Close">
            ${icons.close}
          </button>
        </div>
        <div class="chatpad-hero-content">
          <span class="chatpad-hero-emoji">${welcomeEmoji}</span>
          <h1 class="chatpad-hero-title">${escapeHtml(welcomeTitle)}</h1>
          <p class="chatpad-hero-subtitle">${escapeHtml(welcomeMessage)}</p>
        </div>
      </div>
    `;
  }

  // Render Compact Header (Messages/Help Views)
  function renderCompactHeader() {
    const agent = config.agent || {};
    const avatarUrl = agent.avatar_url;
    const agentName = agent.name || 'Assistant';
    const agentEmoji = config.agentEmoji || '🤖';
    const onlineStatus = config.showOnlineStatus ? 'Online now' : '';

    return `
      <div class="chatpad-compact-header">
        <div class="chatpad-compact-header-info">
          <div class="chatpad-compact-avatar">
            ${avatarUrl ? `<img src="${avatarUrl}" alt="${agentName}" />` : agentEmoji}
          </div>
          <div>
            <div class="chatpad-compact-title">${escapeHtml(agentName)}</div>
            ${onlineStatus ? `<div class="chatpad-compact-status">${onlineStatus}</div>` : ''}
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="chatpad-header-button" onclick="window.chatpadWidget.toggleSettings()" title="Settings">
            ${icons.settings}
          </button>
          <button class="chatpad-header-button" onclick="window.chatpadWidget.minimize()" title="Minimize">
            ${icons.minimize}
          </button>
          <button class="chatpad-header-button" onclick="window.chatpadWidget.close()" title="Close">
            ${icons.close}
          </button>
        </div>
      </div>
    `;
  }

  // Render Settings Dropdown
  function renderSettingsDropdown() {
    if (!showSettingsDropdown) return '';

    return `
      <div class="chatpad-settings-dropdown">
        <div class="chatpad-settings-item" onclick="window.chatpadWidget.toggleSound()">
          <span class="chatpad-settings-label">Sound notifications</span>
          <div class="chatpad-toggle ${chatSettings.soundEnabled ? 'active' : ''}">
            <div class="chatpad-toggle-handle"></div>
          </div>
        </div>
        <div class="chatpad-settings-item" onclick="window.chatpadWidget.toggleAutoScroll()">
          <span class="chatpad-settings-label">Auto-scroll</span>
          <div class="chatpad-toggle ${chatSettings.autoScroll ? 'active' : ''}">
            <div class="chatpad-toggle-handle"></div>
          </div>
        </div>
      </div>
    `;
  }

  // Render Home View
  function renderHome() {
    const announcements = config.announcements || [];
    const quickActions = config.quickActions || [];

    let html = '<div class="chatpad-home">';

    // Announcements
    if (announcements.length > 0) {
      announcements.forEach(announcement => {
        html += `
          <div class="chatpad-announcement" onclick="window.chatpadWidget.handleAnnouncementClick('${announcement.action_url || '#'}')">
            ${announcement.image_url ? `<img src="${announcement.image_url}" alt="" class="chatpad-announcement-image" />` : ''}
            <div class="chatpad-announcement-content">
              <h4>${escapeHtml(announcement.title)}</h4>
              ${announcement.subtitle ? `<p>${escapeHtml(announcement.subtitle)}</p>` : ''}
            </div>
            <span class="chatpad-announcement-arrow">${icons.chevron}</span>
          </div>
        `;
      });
    }

    // Quick Actions - List Style
    if (quickActions.length > 0) {
      html += '<div class="chatpad-quick-actions">';
      quickActions.forEach(action => {
        const iconSvg = action.icon === 'chat' ? icons.chat : icons.help;
        html += `
          <div class="chatpad-quick-action" onclick="window.chatpadWidget.handleQuickAction('${action.type}')">
            <div class="chatpad-quick-action-icon-wrapper">
              <div class="chatpad-quick-action-icon">${iconSvg}</div>
            </div>
            <div class="chatpad-quick-action-content">
              <div class="chatpad-quick-action-title">${escapeHtml(action.label)}</div>
              ${action.subtitle ? `<div class="chatpad-quick-action-subtitle">${escapeHtml(action.subtitle)}</div>` : ''}
            </div>
            <span class="chatpad-quick-action-arrow">${icons.chevron}</span>
          </div>
        `;
      });
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  // Render Messages View
  function renderMessages() {
    let html = '<div class="chatpad-messages">';

    messages.forEach(msg => {
      const isUser = msg.role === 'user';
      const agent = config.agent || {};
      const avatarUrl = agent.avatar_url;
      const agentEmoji = config.agentEmoji || '🤖';

      html += `
        <div class="chatpad-message ${isUser ? 'user' : ''}">
          <div class="chatpad-message-avatar">
            ${!isUser && avatarUrl ? `<img src="${avatarUrl}" alt="" />` : 
              !isUser ? agentEmoji : '👤'}
          </div>
          <div class="chatpad-message-content">
            <div class="chatpad-message-bubble">${escapeHtml(msg.content)}</div>
            <div class="chatpad-message-time">${formatTime(msg.timestamp)}</div>
          </div>
        </div>
      `;
    });

    if (isTyping) {
      html += `
        <div class="chatpad-message">
          <div class="chatpad-message-avatar">${config.agentEmoji || '🤖'}</div>
          <div class="chatpad-message-content">
            <div class="chatpad-message-bubble">
              <div class="chatpad-typing">
                <div class="chatpad-typing-dot"></div>
                <div class="chatpad-typing-dot"></div>
                <div class="chatpad-typing-dot"></div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    html += '</div>';
    return html;
  }

  // Render Help View
  function renderHelp() {
    const helpCategories = config.helpCategories || [];
    
    let html = '<div class="chatpad-help">';
    
    // Search
    html += `
      <div class="chatpad-help-search">
        <input type="text" placeholder="Search help articles..." />
      </div>
    `;

    // Categories and Articles
    helpCategories.forEach(category => {
      html += `
        <div class="chatpad-help-category">
          <h3 class="chatpad-help-category-title">${escapeHtml(category.name)}</h3>
      `;

      (category.articles || []).forEach(article => {
        html += `
          <div class="chatpad-help-article" onclick="window.chatpadWidget.openArticle('${article.id}')">
            <span class="chatpad-help-article-icon">${getIconEmoji(article.icon)}</span>
            <span class="chatpad-help-article-title">${escapeHtml(article.title)}</span>
          </div>
        `;
      });

      html += '</div>';
    });

    html += '</div>';
    return html;
  }

  // Switch view
  function switchView(view) {
    currentView = view;
    updateBottomNav();
    render();
    
    if (view === 'messages' && chatSettings.autoScroll) {
      scrollToBottom();
    }
  }

  // Update bottom navigation
  function updateBottomNav() {
    const navItems = document.querySelectorAll('.chatpad-nav-item');
    navItems.forEach(item => {
      const view = item.getAttribute('data-view');
      if (view === currentView) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // Scroll to bottom
  function scrollToBottom() {
    setTimeout(() => {
      const messagesContainer = document.querySelector('.chatpad-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }

  // Send message
  async function sendMessage() {
    const input = document.querySelector('.chatpad-input');
    const message = input.value.trim();
    
    if (!message) return;

    messages.push({
      role: 'user',
      content: message,
      timestamp: Date.now()
    });

    input.value = '';

    // Play sound if enabled
    if (chatSettings.soundEnabled) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.1;
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    }

    render();
    scrollToBottom();

    // Simulate typing
    isTyping = true;
    render();

    // Simulate AI response
    setTimeout(() => {
      isTyping = false;
      messages.push({
        role: 'assistant',
        content: 'Thank you for your message! This is a demo response.',
        timestamp: Date.now()
      });
      render();
      scrollToBottom();
    }, 2000);
  }

  // Create widget
  function createWidget() {
    const container = document.createElement('div');
    container.className = 'chatpad-widget-container';
    container.id = 'chatpad-widget';

    // Widget button
    const button = document.createElement('button');
    button.className = `chatpad-button ${config.buttonAnimation || ''}`;
    button.innerHTML = `
      ${icons.chat}
      ${config.showOnlineBadge ? '<span class="chatpad-badge"></span>' : ''}
    `;
    button.onclick = () => {
      const window = document.getElementById('chatpad-window');
      const teaser = document.getElementById('chatpad-teaser');
      
      if (window.style.display === 'none') {
        window.style.display = 'flex';
        button.style.display = 'none';
        if (teaser) teaser.style.display = 'none';
      }
    };

    // Teaser
    let teaser = null;
    if (config.showTeaser && config.teaserText) {
      teaser = document.createElement('div');
      teaser.className = 'chatpad-teaser';
      teaser.id = 'chatpad-teaser';
      teaser.innerHTML = `<p class="chatpad-teaser-text">${escapeHtml(config.teaserText)}</p>`;
      teaser.style.display = 'none';
      teaser.onclick = () => {
        const window = document.getElementById('chatpad-window');
        window.style.display = 'flex';
        button.style.display = 'none';
        teaser.style.display = 'none';
      };
    }

    // Chat window
    const chatWindow = document.createElement('div');
    chatWindow.className = 'chatpad-window';
    chatWindow.id = 'chatpad-window';
    chatWindow.style.display = 'none';

    container.appendChild(button);
    if (teaser) container.appendChild(teaser);
    container.appendChild(chatWindow);
    document.body.appendChild(container);

    // Show teaser after delay
    if (teaser && config.showTeaser) {
      setTimeout(() => {
        teaser.style.display = 'block';
      }, config.teaserDelay || 3000);
    }

    render();
  }

  // Render widget content
  function render() {
    const chatWindow = document.getElementById('chatpad-window');
    if (!chatWindow) return;

    const showBottomNav = config.showBottomNav !== false;
    const showBranding = config.showBranding !== false && !showBottomNav;

    let content = '';

    // Header
    if (currentView === 'home') {
      content += renderHeroHeader();
    } else {
      content += renderCompactHeader();
    }

    // Settings Dropdown
    content += renderSettingsDropdown();

    // Main Content
    content += '<div class="chatpad-content">';
    if (currentView === 'home') {
      content += renderHome();
    } else if (currentView === 'messages') {
      content += renderMessages();
    } else if (currentView === 'help') {
      content += renderHelp();
    }
    content += '</div>';

    // Input (for messages view)
    if (currentView === 'messages') {
      content += `
        <div class="chatpad-input-container">
          <div class="chatpad-input-wrapper">
            <input 
              type="text" 
              class="chatpad-input" 
              placeholder="${config.inputPlaceholder || 'Type your message...'}"
              onkeypress="if(event.key==='Enter') window.chatpadWidget.sendMessage()"
            />
            <button class="chatpad-send-button" onclick="window.chatpadWidget.sendMessage()">
              ${icons.send}
            </button>
          </div>
        </div>
      `;
    }

    // Bottom Navigation
    if (showBottomNav) {
      content += `
        <div class="chatpad-bottom-nav">
          <button class="chatpad-nav-item ${currentView === 'home' ? 'active' : ''}" data-view="home" onclick="window.chatpadWidget.switchView('home')">
            <div class="chatpad-nav-icon">${icons.home}</div>
            <div class="chatpad-nav-label">Home</div>
          </button>
          <button class="chatpad-nav-item ${currentView === 'messages' ? 'active' : ''}" data-view="messages" onclick="window.chatpadWidget.switchView('messages')">
            <div class="chatpad-nav-icon">${icons.chat}</div>
            <div class="chatpad-nav-label">Messages</div>
          </button>
          <button class="chatpad-nav-item ${currentView === 'help' ? 'active' : ''}" data-view="help" onclick="window.chatpadWidget.switchView('help')">
            <div class="chatpad-nav-icon">${icons.help}</div>
            <div class="chatpad-nav-label">Help</div>
          </button>
        </div>
      `;
    }

    // Branding
    if (showBranding) {
      content += `
        <div class="chatpad-branding">
          Powered by <a href="https://chatpad.com" target="_blank">ChatPad</a>
        </div>
      `;
    }

    chatWindow.innerHTML = content;
  }

  // Public API
  window.chatpadWidget = {
    switchView,
    sendMessage,
    close: () => {
      const chatWindow = document.getElementById('chatpad-window');
      const button = document.querySelector('.chatpad-button');
      chatWindow.style.display = 'none';
      button.style.display = 'flex';
      showSettingsDropdown = false;
    },
    minimize: () => {
      const chatWindow = document.getElementById('chatpad-window');
      const button = document.querySelector('.chatpad-button');
      chatWindow.style.display = 'none';
      button.style.display = 'flex';
      showSettingsDropdown = false;
    },
    toggleSettings: () => {
      showSettingsDropdown = !showSettingsDropdown;
      render();
    },
    toggleSound: () => {
      chatSettings.soundEnabled = !chatSettings.soundEnabled;
      saveSettings();
      render();
    },
    toggleAutoScroll: () => {
      chatSettings.autoScroll = !chatSettings.autoScroll;
      saveSettings();
      render();
    },
    handleQuickAction: (type) => {
      if (type === 'start_chat') {
        switchView('messages');
      } else if (type === 'open_help') {
        switchView('help');
      }
    },
    handleAnnouncementClick: (url) => {
      if (url && url !== '#') {
        window.open(url, '_blank');
      }
    },
    openArticle: (articleId) => {
      console.log('Open article:', articleId);
      // Could implement article detail view here
    }
  };

  // Fetch config
  async function fetchConfig() {
    try {
      const response = await fetch(`${API_URL}/get-widget-config?agent_id=${agentId}`);
      config = await response.json();
      return config;
    } catch (error) {
      console.error('ChatPad Agent: Failed to load config:', error);
      // Return minimal default config
      return {
        agent: { name: 'Assistant', avatar_url: null },
        welcomeTitle: 'Welcome!',
        welcomeMessage: 'How can we help you today?',
        welcomeEmoji: '👋',
        agentEmoji: '🤖',
        quickActions: [
          { type: 'start_chat', label: 'Start Chat', subtitle: 'Begin a conversation', icon: 'chat' },
          { type: 'open_help', label: 'Help Center', subtitle: 'Browse articles', icon: 'help' }
        ],
        announcements: [],
        helpCategories: [],
        showBottomNav: true,
        showBranding: true,
        showOnlineBadge: true,
        showOnlineStatus: true,
        showTeaser: false,
        inputPlaceholder: 'Type your message...'
      };
    }
  }

  // Initialize
  async function init() {
    loadSettings();
    injectStyles();
    config = await fetchConfig();
    
    if (!config) {
      console.error('ChatPad Agent: Failed to initialize');
      return;
    }

    messages = [
      {
        role: 'assistant',
        content: config.greeting || 'Hello! How can I help you today?',
        timestamp: Date.now()
      }
    ];

    createWidget();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
