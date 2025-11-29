(function() {
  'use strict';

  // Get configuration from script attributes
  const script = document.currentScript;
  const config = {
    agentId: script.getAttribute('data-agent-id'),
    primaryColor: script.getAttribute('data-primary-color') || '#000000',
    secondaryColor: script.getAttribute('data-secondary-color') || '#ffffff',
    position: script.getAttribute('data-position') || 'bottom-right',
    greeting: script.getAttribute('data-greeting') || 'Hi! How can I help you today?',
    placeholder: script.getAttribute('data-placeholder') || 'Type your message...',
    showBranding: script.getAttribute('data-show-branding') !== 'false',
    agentName: script.getAttribute('data-agent-name') || 'AI Assistant',
    avatarUrl: script.getAttribute('data-avatar-url') || null,
  };

  if (!config.agentId) {
    console.error('AI Chat Widget: data-agent-id is required');
    return;
  }

  // Create widget styles
  const styles = `
    .ai-chat-widget-container {
      position: fixed;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    .ai-chat-widget-container.bottom-right { bottom: 20px; right: 20px; }
    .ai-chat-widget-container.bottom-left { bottom: 20px; left: 20px; }
    .ai-chat-widget-container.top-right { top: 20px; right: 20px; }
    .ai-chat-widget-container.top-left { top: 20px; left: 20px; }
    
    .ai-chat-widget-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    }
    .ai-chat-widget-button:hover {
      transform: scale(1.05);
    }
    .ai-chat-widget-button svg {
      width: 28px;
      height: 28px;
      fill: ${config.secondaryColor};
    }
    
    .ai-chat-widget-window {
      width: 380px;
      height: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .ai-chat-widget-window.hidden {
      display: none;
    }
    
    .ai-chat-widget-header {
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: ${config.primaryColor};
      color: ${config.secondaryColor};
    }
    .ai-chat-widget-header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .ai-chat-widget-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: ${config.secondaryColor};
      color: ${config.primaryColor};
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 16px;
    }
    .ai-chat-widget-close {
      background: none;
      border: none;
      color: ${config.secondaryColor};
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .ai-chat-widget-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f9fafb;
    }
    .ai-chat-widget-message {
      margin-bottom: 12px;
      display: flex;
    }
    .ai-chat-widget-message.user {
      justify-content: flex-end;
    }
    .ai-chat-widget-message-bubble {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
    }
    .ai-chat-widget-message.user .ai-chat-widget-message-bubble {
      background: ${config.primaryColor};
      color: ${config.secondaryColor};
    }
    .ai-chat-widget-message.assistant .ai-chat-widget-message-bubble {
      background: #e5e7eb;
      color: #1f2937;
    }
    
    .ai-chat-widget-input-area {
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      background: white;
    }
    .ai-chat-widget-input-form {
      display: flex;
      gap: 8px;
    }
    .ai-chat-widget-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }
    .ai-chat-widget-input:focus {
      border-color: ${config.primaryColor};
    }
    .ai-chat-widget-send {
      padding: 10px 16px;
      background: ${config.primaryColor};
      color: ${config.secondaryColor};
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
    }
    .ai-chat-widget-branding {
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
      margin-top: 8px;
    }
    
    @media (max-width: 480px) {
      .ai-chat-widget-window {
        width: 100vw;
        height: 100vh;
        border-radius: 0;
      }
      .ai-chat-widget-container {
        inset: 0 !important;
      }
    }
  `;

  // Inject styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Create widget HTML
  const container = document.createElement('div');
  container.className = `ai-chat-widget-container ${config.position}`;
  container.innerHTML = `
    <button class="ai-chat-widget-button" style="background: ${config.primaryColor}">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.67-.33-3.82-.91l-.27-.16-2.84.48.48-2.84-.16-.27C4.33 14.67 4 13.38 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
      </svg>
    </button>
    
    <div class="ai-chat-widget-window hidden">
      <div class="ai-chat-widget-header">
        <div class="ai-chat-widget-header-content">
          <div class="ai-chat-widget-avatar">${config.agentName.charAt(0).toUpperCase()}</div>
          <div>
            <div style="font-weight: 600; font-size: 14px;">${config.agentName}</div>
            <div style="font-size: 12px; opacity: 0.8;">Online</div>
          </div>
        </div>
        <button class="ai-chat-widget-close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      <div class="ai-chat-widget-messages"></div>
      
      <div class="ai-chat-widget-input-area">
        <form class="ai-chat-widget-input-form">
          <input 
            type="text" 
            class="ai-chat-widget-input" 
            placeholder="${config.placeholder}"
            required
          />
          <button type="submit" class="ai-chat-widget-send">Send</button>
        </form>
        ${config.showBranding ? '<div class="ai-chat-widget-branding">Powered by Your Company</div>' : ''}
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // Get elements
  const button = container.querySelector('.ai-chat-widget-button');
  const window = container.querySelector('.ai-chat-widget-window');
  const closeBtn = container.querySelector('.ai-chat-widget-close');
  const messagesContainer = container.querySelector('.ai-chat-widget-messages');
  const form = container.querySelector('.ai-chat-widget-input-form');
  const input = container.querySelector('.ai-chat-widget-input');

  // Message state
  const messages = [];

  // Add greeting message
  addMessage('assistant', config.greeting);

  // Toggle widget
  button.addEventListener('click', () => {
    window.classList.toggle('hidden');
    button.style.display = window.classList.contains('hidden') ? 'flex' : 'none';
    if (!window.classList.contains('hidden')) {
      input.focus();
    }
  });

  closeBtn.addEventListener('click', () => {
    window.classList.add('hidden');
    button.style.display = 'flex';
  });

  // Handle message submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    // Add user message
    addMessage('user', message);
    input.value = '';

    // Send to API and stream response
    try {
      await streamMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    }
  });

  function addMessage(role, content) {
    messages.push({ role, content });
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-chat-widget-message ${role}`;
    messageDiv.innerHTML = `
      <div class="ai-chat-widget-message-bubble">${escapeHtml(content)}</div>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  async function streamMessage(userMessage) {
    const apiUrl = `https://mvaimvwdukpgvkifkfpa.supabase.co/functions/v1/widget-chat`;
    
    // Create placeholder for assistant message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'ai-chat-widget-message assistant';
    const bubble = document.createElement('div');
    bubble.className = 'ai-chat-widget-message-bubble';
    bubble.textContent = '';
    messageDiv.appendChild(bubble);
    messagesContainer.appendChild(messageDiv);

    let assistantMessage = '';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: config.agentId,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith(':')) continue;
        if (!line.startsWith('data: ')) continue;

        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantMessage += content;
            bubble.textContent = assistantMessage;
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    messages.push({ role: 'assistant', content: assistantMessage });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();
