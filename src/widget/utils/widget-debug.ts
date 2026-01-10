/**
 * Widget Debug System
 * Provides visible checkpoints when ?debugWidget=1 is in URL
 */

export interface DebugCheckpoint {
  id: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

// In-memory checkpoint store
const checkpoints: DebugCheckpoint[] = [];
const MAX_CHECKPOINTS = 20;

// Check if debug mode is enabled
export function isWidgetDebugEnabled(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('debugWidget') === '1';
  } catch {
    return false;
  }
}

// Add a checkpoint
export function addCheckpoint(id: string, data?: Record<string, unknown>): void {
  const checkpoint: DebugCheckpoint = {
    id,
    timestamp: Date.now(),
    data,
  };
  
  checkpoints.push(checkpoint);
  
  // Keep only last N checkpoints
  if (checkpoints.length > MAX_CHECKPOINTS) {
    checkpoints.shift();
  }
  
  // Always log to console in debug mode
  if (isWidgetDebugEnabled()) {
    console.log(`[WIDGET-DEBUG] ${id}`, data || '');
  }
  
  // Dispatch event for UI to listen
  window.dispatchEvent(new CustomEvent('widget-debug-checkpoint', { 
    detail: checkpoint 
  }));
}

// Get all checkpoints
export function getCheckpoints(): DebugCheckpoint[] {
  return [...checkpoints];
}

// Clear checkpoints
export function clearCheckpoints(): void {
  checkpoints.length = 0;
}

// Debug state for overlay
export interface WidgetDebugState {
  chatUser: boolean;
  activeConversationId: string | null;
  lastError: string | null;
}

let debugState: WidgetDebugState = {
  chatUser: false,
  activeConversationId: null,
  lastError: null,
};

export function updateDebugState(partial: Partial<WidgetDebugState>): void {
  debugState = { ...debugState, ...partial };
  window.dispatchEvent(new CustomEvent('widget-debug-state', { 
    detail: debugState 
  }));
}

export function getDebugState(): WidgetDebugState {
  return { ...debugState };
}
