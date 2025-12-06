/**
 * Session Utilities
 * 
 * Functions for managing session IDs and localStorage persistence.
 */

/**
 * Get or create a session ID for the current user
 * @returns The session ID string
 */
export function getSessionId(): string {
  let sessionId = localStorage.getItem('chatpad_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('chatpad_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Get or create a unique visitor ID for analytics
 * @param agentId - The agent ID to scope the visitor to
 * @returns The visitor ID string
 */
export function getOrCreateVisitorId(agentId: string): string {
  const key = `chatpad_visitor_id_${agentId}`;
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  
  const newId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  localStorage.setItem(key, newId);
  return newId;
}

/**
 * Check if a takeover notice has been shown for a conversation (persisted)
 * @param agentId - The agent ID
 * @param conversationId - The conversation ID
 * @returns True if notice was already shown
 */
export function hasTakeoverNoticeBeenShown(agentId: string, conversationId: string): boolean {
  if (!conversationId) return false;
  const key = `chatpad_takeover_noticed_${agentId}_${conversationId}`;
  return localStorage.getItem(key) === 'true';
}

/**
 * Mark that a takeover notice has been shown for a conversation
 * @param agentId - The agent ID
 * @param conversationId - The conversation ID
 */
export function setTakeoverNoticeShown(agentId: string, conversationId: string): void {
  if (!conversationId) return;
  const key = `chatpad_takeover_noticed_${agentId}_${conversationId}`;
  localStorage.setItem(key, 'true');
}

/**
 * Clear the takeover notice flag for a conversation
 * @param agentId - The agent ID
 * @param conversationId - The conversation ID
 */
export function clearTakeoverNotice(agentId: string, conversationId: string): void {
  if (!conversationId) return;
  const key = `chatpad_takeover_noticed_${agentId}_${conversationId}`;
  localStorage.removeItem(key);
}
