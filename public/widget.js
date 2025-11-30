(function() {
  'use strict';

  // Configuration
  const script = document.currentScript;
  const agentId = script.getAttribute('data-agent-id');
  const position = script.getAttribute('data-position') || 'bottom-right';
  const primaryColor = script.getAttribute('data-primary-color') || '#6366f1';

  if (!agentId) {
    console.error('ChatPad Widget: data-agent-id is required');
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

      .chatpad-header {
        padding: 20px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .chatpad-header.gradient {
        background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%);
      }

      .chatpad-header.solid {
        background: ${primaryColor};
      }

      .chatpad-header-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .chatpad-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
      }

      .chatpad-avatar img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      .chatpad-header-text h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }

      .chatpad-header-text p {
        margin: 4px 0 0;
        font-size: 12px;
        opacity: 0.9;
      }

      .chatpad-close {
        background: rgba(255,255,255,0.2);
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
        transition: background 0.2s;
      }

      .chatpad-close:hover {
        background: rgba(255,255,255,0.3);
      }

      .chatpad-content {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }

      .chatpad-home {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .chatpad-welcome {
        text-align: center;
        padding: 20px 0;
      }

      .chatpad-welcome-emoji {
        font-size: 48px;
        margin-bottom: 12px;
      }

      .chatpad-welcome h2 {
        margin: 0 0 8px;
        font-size: 24px;
        color: #1f2937;
      }

      .chatpad-welcome p {
        margin: 0;
        font-size: 14px;
        color: #6b7280;
      }

      .chatpad-announcement {
        background: linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}08 100%);
        border: 1px solid ${primaryColor}30;
        border-radius: 12px;
        padding: 16px;
        display: flex;
        gap: 12px;
        animation: chatpad-fade-in 0.3s ease-out;
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
        margin: 0 0 8px;
        font-size: 13px;
        color: #4b5563;
      }

      .chatpad-announcement-action {
        display: inline-block;
        color: ${primaryColor};
        font-size: 13px;
        font-weight: 500;
        text-decoration: none;
        cursor: pointer;
      }

      .chatpad-quick-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .chatpad-quick-action {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 20px 16px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
      }

      .chatpad-quick-action:hover {
        background: #f3f4f6;
        border-color: ${primaryColor};
        transform: translateY(-2px);
      }

      .chatpad-quick-action-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }

      .chatpad-quick-action-label {
        font-size: 14px;
        font-weight: 500;
        color: #1f2937;
      }

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

      .chatpad-article-view {
        padding: 20px;
        overflow-y: auto;
      }

      .chatpad-article-back {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: ${primaryColor};
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        margin-bottom: 16px;
      }

      .chatpad-article-title {
        font-size: 20px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 16px;
      }

      .chatpad-article-content {
        font-size: 14px;
        line-height: 1.6;
        color: #4b5563;
      }

      .chatpad-contact-form {
        padding: 20px;
        overflow-y: auto;
      }

      .chatpad-contact-form h3 {
        margin: 0 0 8px;
        font-size: 20px;
        font-weight: 600;
        color: #1f2937;
      }

      .chatpad-contact-form p {
        margin: 0 0 20px;
        font-size: 14px;
        color: #6b7280;
      }

      .chatpad-form-group {
        margin-bottom: 16px;
      }

      .chatpad-form-label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        margin-bottom: 6px;
      }

      .chatpad-form-input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        font-size: 14px;
        outline: none;
        box-sizing: border-box;
      }

      .chatpad-form-input:focus {
        border-color: ${primaryColor};
      }

      .chatpad-form-textarea {
        resize: vertical;
        min-height: 80px;
      }

      .chatpad-form-error {
        color: #ef4444;
        font-size: 12px;
        margin-top: 4px;
      }

      .chatpad-form-submit {
        width: 100%;
        padding: 12px;
        background: ${primaryColor};
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .chatpad-form-submit:hover {
        opacity: 0.9;
      }

      .chatpad-form-submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .chatpad-input-area {
        padding: 16px;
        border-top: 1px solid #e5e7eb;
      }

      .chatpad-file-preview {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
        flex-wrap: wrap;
      }

      .chatpad-file-item {
        position: relative;
        width: 60px;
        height: 60px;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
      }

      .chatpad-file-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .chatpad-file-remove {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: rgba(0,0,0,0.6);
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
      }

      .chatpad-input-wrapper {
        display: flex;
        gap: 8px;
      }

      .chatpad-input {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid #e5e7eb;
        border-radius: 24px;
        font-size: 14px;
        outline: none;
        resize: none;
        max-height: 120px;
      }

      .chatpad-input:focus {
        border-color: ${primaryColor};
      }

      .chatpad-input-actions {
        display: flex;
        gap: 8px;
      }

      .chatpad-attach-button,
      .chatpad-send-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }

      .chatpad-attach-button {
        background: #f3f4f6;
        color: #6b7280;
      }

      .chatpad-attach-button:hover {
        background: #e5e7eb;
      }

      .chatpad-send-button {
        background: ${primaryColor};
        color: white;
      }

      .chatpad-send-button:hover {
        opacity: 0.9;
      }

      .chatpad-send-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .chatpad-bottom-nav {
        display: flex;
        border-top: 1px solid #e5e7eb;
        background: white;
      }

      .chatpad-nav-item {
        flex: 1;
        padding: 12px;
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        transition: all 0.2s;
      }

      .chatpad-nav-item:hover {
        background: #f9fafb;
      }

      .chatpad-nav-item.active {
        color: ${primaryColor};
      }

      .chatpad-nav-icon {
        font-size: 20px;
      }

      .chatpad-nav-label {
        font-size: 11px;
        font-weight: 500;
      }

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
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
        }
      }

      .hidden {
        display: none !important;
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }

  // Fetch widget configuration
  async function fetchConfig() {
    try {
      const response = await fetch(`${API_URL}/get-widget-config?agentId=${agentId}`);
      if (!response.ok) throw new Error('Failed to fetch widget config');
      config = await response.json();
      return config;
    } catch (error) {
      console.error('ChatPad Widget: Failed to load config:', error);
      // Return minimal default config
      return {
        agent: { name: 'Assistant', avatar_url: null },
        config: {
          primaryColor: primaryColor,
          position: position,
          animation: 'bounce',
          showBadge: true,
          greeting: 'Hello! How can I help you today?',
          placeholder: 'Type your message...',
          showBranding: true,
          showBottomNav: true,
          quickActions: [
            { icon: '💬', label: 'Start a Chat', action: 'open_messages' },
            { icon: '📚', label: 'Help Articles', action: 'open_help' }
          ]
        },
        announcements: [],
        helpArticles: [],
        helpCategories: []
      };
    }
  }

  // Format time
  function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  }

  // Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Render functions
  function renderHome() {
    const { welcomeEmoji, welcomeTitle, welcomeSubtitle, quickActions } = config.config;
    const announcements = config.announcements || [];

    let html = '<div class="chatpad-home">';
    
    // Welcome section
    html += `
      <div class="chatpad-welcome">
        <div class="chatpad-welcome-emoji">${welcomeEmoji}</div>
        <h2>${escapeHtml(welcomeTitle)}</h2>
        <p>${escapeHtml(welcomeSubtitle)}</p>
      </div>
    `;

    // Announcements
    announcements.forEach(announcement => {
      const bgColor = announcement.background_color || `${config.config.primaryColor}15`;
      const titleColor = announcement.title_color || '#1f2937';
      
      html += `
        <div class="chatpad-announcement" style="background: ${bgColor};">
          ${announcement.image_url ? `<img src="${announcement.image_url}" alt="" class="chatpad-announcement-image">` : ''}
          <div class="chatpad-announcement-content">
            <h4 style="color: ${titleColor};">${escapeHtml(announcement.title)}</h4>
            ${announcement.subtitle ? `<p>${escapeHtml(announcement.subtitle)}</p>` : ''}
            ${announcement.action_url ? `<a href="${announcement.action_url}" class="chatpad-announcement-action" target="_blank">${announcement.action_type === 'link' ? 'Learn more' : 'Open'} →</a>` : ''}
          </div>
        </div>
      `;
    });

    // Quick actions
    html += '<div class="chatpad-quick-actions">';
    quickActions.forEach(action => {
      html += `
        <div class="chatpad-quick-action" data-action="${action.action}">
          <div class="chatpad-quick-action-icon">${action.icon}</div>
          <div class="chatpad-quick-action-label">${escapeHtml(action.label)}</div>
        </div>
      `;
    });
    html += '</div>';

    html += '</div>';
    return html;
  }

  function renderMessages() {
    let html = '<div class="chatpad-messages" id="chatpad-messages-list">';
    
    messages.forEach(msg => {
      const isUser = msg.role === 'user';
      const time = formatTime(new Date(msg.created_at || Date.now()));
      
      html += `
        <div class="chatpad-message ${isUser ? 'user' : 'assistant'}">
          ${!isUser ? `
            <div class="chatpad-message-avatar">
              ${config.agent.avatar_url ? 
                `<img src="${config.agent.avatar_url}" alt="${config.agent.name}">` : 
                '🤖'
              }
            </div>
          ` : ''}
          <div class="chatpad-message-content">
            <div class="chatpad-message-bubble">${escapeHtml(msg.content)}</div>
            ${config.config.showTimestamps ? `<div class="chatpad-message-time">${time}</div>` : ''}
          </div>
        </div>
      `;
    });

    if (isTyping && config.config.showTypingIndicator) {
      html += `
        <div class="chatpad-message assistant">
          <div class="chatpad-message-avatar">
            ${config.agent.avatar_url ? 
              `<img src="${config.agent.avatar_url}" alt="${config.agent.name}">` : 
              '🤖'
            }
          </div>
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

  function renderHelp() {
    const categories = config.helpCategories || [];
    const articles = config.helpArticles || [];

    let html = '<div class="chatpad-help">';
    
    // Search (placeholder for now)
    html += `
      <div class="chatpad-help-search">
        <input type="text" placeholder="Search articles..." id="chatpad-help-search">
      </div>
    `;

    if (categories.length === 0 && articles.length === 0) {
      html += '<p style="text-align: center; color: #9ca3af; padding: 40px 0;">No help articles available yet.</p>';
    } else {
      categories.forEach(category => {
        const categoryArticles = articles.filter(a => a.category_id === category.id);
        if (categoryArticles.length === 0) return;

        html += `
          <div class="chatpad-help-category">
            <h3 class="chatpad-help-category-title">${escapeHtml(category.name)}</h3>
        `;

        categoryArticles.forEach(article => {
          html += `
            <div class="chatpad-help-article" data-article-id="${article.id}">
              ${article.icon ? `<span class="chatpad-help-article-icon">${article.icon}</span>` : ''}
              <span class="chatpad-help-article-title">${escapeHtml(article.title)}</span>
            </div>
          `;
        });

        html += '</div>';
      });
    }

    html += '</div>';
    return html;
  }

  function renderArticle(articleId) {
    const article = config.helpArticles.find(a => a.id === articleId);
    if (!article) return '<div>Article not found</div>';

    return `
      <div class="chatpad-article-view">
        <div class="chatpad-article-back" id="chatpad-article-back">
          ← Back to Help
        </div>
        <h1 class="chatpad-article-title">${escapeHtml(article.title)}</h1>
        <div class="chatpad-article-content">${article.content}</div>
      </div>
    `;
  }

  function renderContactForm() {
    const { contactFormTitle, contactFormSubtitle, customFields } = config.config;

    let html = `
      <div class="chatpad-contact-form">
        <h3>${escapeHtml(contactFormTitle)}</h3>
        <p>${escapeHtml(contactFormSubtitle)}</p>
        <form id="chatpad-contact-form">
          <div class="chatpad-form-group">
            <label class="chatpad-form-label">First Name *</label>
            <input type="text" name="firstName" class="chatpad-form-input" required>
          </div>
          <div class="chatpad-form-group">
            <label class="chatpad-form-label">Last Name *</label>
            <input type="text" name="lastName" class="chatpad-form-input" required>
          </div>
          <div class="chatpad-form-group">
            <label class="chatpad-form-label">Email *</label>
            <input type="email" name="email" class="chatpad-form-input" required>
          </div>
    `;

    // Custom fields
    customFields.forEach(field => {
      html += `<div class="chatpad-form-group">`;
      html += `<label class="chatpad-form-label">${escapeHtml(field.label)}${field.required ? ' *' : ''}</label>`;
      
      if (field.type === 'textarea') {
        html += `<textarea name="${field.name}" class="chatpad-form-input chatpad-form-textarea" ${field.required ? 'required' : ''}></textarea>`;
      } else if (field.type === 'select') {
        html += `<select name="${field.name}" class="chatpad-form-input" ${field.required ? 'required' : ''}>`;
        html += `<option value="">Select...</option>`;
        field.options.forEach(opt => {
          html += `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`;
        });
        html += `</select>`;
      } else {
        html += `<input type="${field.type}" name="${field.name}" class="chatpad-form-input" ${field.required ? 'required' : ''}>`;
      }
      
      html += `</div>`;
    });

    html += `
          <button type="submit" class="chatpad-form-submit">Start Chatting</button>
        </form>
      </div>
    `;

    return html;
  }

  // View management
  function switchView(view, data = null) {
    currentView = view;
    const content = document.getElementById('chatpad-content');
    
    if (view === 'home') {
      content.innerHTML = renderHome();
      attachHomeListeners();
    } else if (view === 'messages') {
      if (!leadCaptured && config.config.enableContactForm) {
        content.innerHTML = renderContactForm();
        attachContactFormListeners();
      } else {
        content.innerHTML = renderMessages();
        if (!conversationId) {
          // Add greeting message
          messages.push({
            role: 'assistant',
            content: config.config.greeting,
            created_at: new Date().toISOString()
          });
          content.innerHTML = renderMessages();
        }
        attachMessagesListeners();
        scrollToBottom();
      }
    } else if (view === 'help') {
      content.innerHTML = renderHelp();
      attachHelpListeners();
    } else if (view === 'article') {
      content.innerHTML = renderArticle(data);
      attachArticleListeners();
    }

    updateBottomNav();
  }

  function updateBottomNav() {
    const navItems = document.querySelectorAll('.chatpad-nav-item');
    navItems.forEach(item => {
      const view = item.getAttribute('data-view');
      if (view === currentView || (currentView === 'article' && view === 'help')) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  function scrollToBottom() {
    setTimeout(() => {
      const messagesList = document.getElementById('chatpad-messages-list');
      if (messagesList) {
        messagesList.scrollTop = messagesList.scrollHeight;
      }
    }, 100);
  }

  // Event listeners
  function attachHomeListeners() {
    document.querySelectorAll('.chatpad-quick-action').forEach(action => {
      action.addEventListener('click', () => {
        const actionType = action.getAttribute('data-action');
        if (actionType === 'open_messages') {
          switchView('messages');
        } else if (actionType === 'open_help') {
          switchView('help');
        }
      });
    });
  }

  function attachMessagesListeners() {
    const input = document.getElementById('chatpad-input');
    const sendBtn = document.getElementById('chatpad-send');
    const attachBtn = document.getElementById('chatpad-attach');

    if (sendBtn) {
      sendBtn.addEventListener('click', sendMessage);
    }

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    if (attachBtn && config.config.enableFileUpload) {
      attachBtn.addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = config.config.allowedFileTypes.join(',');
        fileInput.multiple = false;
        fileInput.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            if (file.size > config.config.maxFileSize * 1024 * 1024) {
              alert(`File size exceeds ${config.config.maxFileSize}MB limit`);
              return;
            }
            selectedFiles.push(file);
            updateFilePreview();
          }
        };
        fileInput.click();
      });
    }
  }

  function attachHelpListeners() {
    document.querySelectorAll('.chatpad-help-article').forEach(article => {
      article.addEventListener('click', () => {
        const articleId = article.getAttribute('data-article-id');
        switchView('article', articleId);
      });
    });
  }

  function attachArticleListeners() {
    const backBtn = document.getElementById('chatpad-article-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        switchView('help');
      });
    }
  }

  function attachContactFormListeners() {
    const form = document.getElementById('chatpad-contact-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Store lead in localStorage
        localStorage.setItem(`chatpad_lead_${agentId}`, JSON.stringify(data));
        leadCaptured = true;

        // Create lead in database (optional - could be done server-side)
        // For now, just switch to messages
        switchView('messages');
      });
    }
  }

  function updateFilePreview() {
    // File preview implementation
    const preview = document.getElementById('chatpad-file-preview');
    if (!preview) return;

    preview.innerHTML = '';
    selectedFiles.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'chatpad-file-item';
      
      if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        item.appendChild(img);
      }

      const removeBtn = document.createElement('button');
      removeBtn.className = 'chatpad-file-remove';
      removeBtn.textContent = '×';
      removeBtn.onclick = () => {
        selectedFiles.splice(index, 1);
        updateFilePreview();
      };
      item.appendChild(removeBtn);

      preview.appendChild(item);
    });
  }

  async function sendMessage() {
    const input = document.getElementById('chatpad-input');
    const message = input.value.trim();
    
    if (!message) return;

    // Add user message
    messages.push({
      role: 'user',
      content: message,
      created_at: new Date().toISOString()
    });

    input.value = '';
    
    // Re-render messages
    const content = document.getElementById('chatpad-content');
    content.innerHTML = renderMessages();
    attachMessagesListeners();
    scrollToBottom();

    // Show typing indicator
    isTyping = true;
    content.innerHTML = renderMessages();
    attachMessagesListeners();
    scrollToBottom();

    try {
      const response = await fetch(`${API_URL}/widget-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          conversationId,
          messages: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      conversationId = data.conversationId;

      // Add assistant response
      messages.push({
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error sending message:', error);
      messages.push({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        created_at: new Date().toISOString()
      });
    } finally {
      isTyping = false;
      content.innerHTML = renderMessages();
      attachMessagesListeners();
      scrollToBottom();
    }
  }

  // Create widget UI
  function createWidget() {
    const container = document.createElement('div');
    container.className = 'chatpad-widget-container';
    container.innerHTML = `
      <div id="chatpad-button" class="chatpad-button animate-${config.config.animation}">
        <svg class="chatpad-button-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
        </svg>
        ${config.config.showBadge ? '<div class="chatpad-badge"></div>' : ''}
      </div>
      ${config.config.showTeaser ? `<div id="chatpad-teaser" class="chatpad-teaser"><p class="chatpad-teaser-text">${escapeHtml(config.config.teaserText)}</p></div>` : ''}
      <div id="chatpad-window" class="chatpad-window hidden">
        <div class="chatpad-header ${config.config.useGradientHeader ? 'gradient' : 'solid'}">
          <div class="chatpad-header-info">
            <div class="chatpad-avatar">
              ${config.agent.avatar_url ? 
                `<img src="${config.agent.avatar_url}" alt="${config.agent.name}">` : 
                '🤖'
              }
            </div>
            <div class="chatpad-header-text">
              <h3>${escapeHtml(config.agent.name)}</h3>
              <p>Online now</p>
            </div>
          </div>
          <button id="chatpad-close" class="chatpad-close">×</button>
        </div>
        <div id="chatpad-content" class="chatpad-content"></div>
        ${config.config.showBottomNav ? `
          <div class="chatpad-bottom-nav">
            <button class="chatpad-nav-item active" data-view="home">
              <span class="chatpad-nav-icon">🏠</span>
              <span class="chatpad-nav-label">Home</span>
            </button>
            <button class="chatpad-nav-item" data-view="messages">
              <span class="chatpad-nav-icon">💬</span>
              <span class="chatpad-nav-label">Messages</span>
            </button>
            <button class="chatpad-nav-item" data-view="help">
              <span class="chatpad-nav-icon">📚</span>
              <span class="chatpad-nav-label">Help</span>
            </button>
          </div>
        ` : ''}
        <div class="chatpad-input-area ${!config.config.showBottomNav ? '' : 'hidden'}">
          ${config.config.enableFileUpload ? '<div id="chatpad-file-preview" class="chatpad-file-preview"></div>' : ''}
          <div class="chatpad-input-wrapper">
            <textarea id="chatpad-input" class="chatpad-input" placeholder="${escapeHtml(config.config.placeholder)}" rows="1"></textarea>
            <div class="chatpad-input-actions">
              ${config.config.enableFileUpload ? `
                <button id="chatpad-attach" class="chatpad-attach-button">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                  </svg>
                </button>
              ` : ''}
              <button id="chatpad-send" class="chatpad-send-button">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        ${config.config.showBranding ? `
          <div class="chatpad-branding">
            Powered by <a href="https://chatpad.app" target="_blank">ChatPad</a>
          </div>
        ` : ''}
      </div>
    `;

    document.body.appendChild(container);

    // Event listeners
    const button = document.getElementById('chatpad-button');
    const window = document.getElementById('chatpad-window');
    const closeBtn = document.getElementById('chatpad-close');
    const teaser = document.getElementById('chatpad-teaser');

    button.addEventListener('click', () => {
      window.classList.remove('hidden');
      button.style.display = 'none';
      if (teaser) teaser.style.display = 'none';
      if (!currentView) switchView('home');
    });

    if (teaser) {
      teaser.addEventListener('click', () => {
        window.classList.remove('hidden');
        button.style.display = 'none';
        teaser.style.display = 'none';
        if (!currentView) switchView('home');
      });

      // Auto-dismiss teaser after 5 seconds
      setTimeout(() => {
        if (teaser && window.classList.contains('hidden')) {
          teaser.style.display = 'none';
        }
      }, 5000);
    }

    closeBtn.addEventListener('click', () => {
      window.classList.add('hidden');
      button.style.display = 'flex';
    });

    // Bottom nav listeners
    if (config.config.showBottomNav) {
      document.querySelectorAll('.chatpad-nav-item').forEach(item => {
        item.addEventListener('click', () => {
          const view = item.getAttribute('data-view');
          switchView(view);
        });
      });
    }

    // Handle display timing
    if (config.config.displayTiming === 'delayed') {
      button.style.display = 'none';
      setTimeout(() => {
        button.style.display = 'flex';
      }, config.config.delaySeconds * 1000);
    } else if (config.config.displayTiming === 'scroll') {
      button.style.display = 'none';
      window.addEventListener('scroll', () => {
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercent >= config.config.scrollDepth) {
          button.style.display = 'flex';
        }
      });
    }
  }

  // Initialize
  async function init() {
    injectStyles();
    await fetchConfig();
    createWidget();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
