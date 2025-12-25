/**
 * Widget Takeover Hook
 * 
 * Manages human takeover state and typing indicators for the chat widget.
 * Centralizes all state related to human agent intervention including:
 * - Whether a human has taken over the conversation
 * - Human agent name and avatar during takeover
 * - Human typing indicator state
 * 
 * @module widget/hooks/useWidgetTakeover
 * 
 * @example
 * ```tsx
 * const {
 *   isHumanTakeover,
 *   setIsHumanTakeover,
 *   takeoverAgentName,
 *   setTakeoverAgentName,
 *   takeoverAgentAvatar,
 *   setTakeoverAgentAvatar,
 *   isHumanTyping,
 *   setIsHumanTyping,
 *   typingAgentName,
 *   setTypingAgentName,
 * } = useWidgetTakeover();
 * ```
 */
import { useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface UseWidgetTakeoverReturn {
  // === Takeover State ===
  /** Whether a human agent has taken over the conversation */
  isHumanTakeover: boolean;
  /** Set human takeover state */
  setIsHumanTakeover: (value: boolean) => void;
  /** Name of the human agent who took over */
  takeoverAgentName: string | undefined;
  /** Set takeover agent name */
  setTakeoverAgentName: (name: string | undefined) => void;
  /** Avatar URL of the human agent who took over */
  takeoverAgentAvatar: string | undefined;
  /** Set takeover agent avatar */
  setTakeoverAgentAvatar: (avatar: string | undefined) => void;
  
  // === Typing State ===
  /** Whether a human agent is currently typing */
  isHumanTyping: boolean;
  /** Set human typing state */
  setIsHumanTyping: (value: boolean) => void;
  /** Name of the human agent who is typing */
  typingAgentName: string | undefined;
  /** Set typing agent name */
  setTypingAgentName: (name: string | undefined) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useWidgetTakeover(): UseWidgetTakeoverReturn {
  // === Takeover State ===
  const [isHumanTakeover, setIsHumanTakeover] = useState(false);
  const [takeoverAgentName, setTakeoverAgentName] = useState<string | undefined>();
  const [takeoverAgentAvatar, setTakeoverAgentAvatar] = useState<string | undefined>();
  
  // === Typing State ===
  const [isHumanTyping, setIsHumanTyping] = useState(false);
  const [typingAgentName, setTypingAgentName] = useState<string | undefined>();

  return {
    // Takeover State
    isHumanTakeover,
    setIsHumanTakeover,
    takeoverAgentName,
    setTakeoverAgentName,
    takeoverAgentAvatar,
    setTakeoverAgentAvatar,
    
    // Typing State
    isHumanTyping,
    setIsHumanTyping,
    typingAgentName,
    setTypingAgentName,
  };
}
