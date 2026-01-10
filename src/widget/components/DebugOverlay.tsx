/**
 * Debug Overlay for Widget
 * Shows checkpoints and state when ?debugWidget=1 is in URL
 */

import { useEffect, useState } from 'react';
import { 
  getCheckpoints, 
  getDebugState, 
  isWidgetDebugEnabled,
  type DebugCheckpoint,
  type WidgetDebugState 
} from '../utils/widget-debug';

export function DebugOverlay() {
  const [checkpoints, setCheckpoints] = useState<DebugCheckpoint[]>([]);
  const [state, setState] = useState<WidgetDebugState>(getDebugState());
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isWidgetDebugEnabled()) return;

    // Initial load
    setCheckpoints(getCheckpoints());
    setState(getDebugState());

    // Listen for updates
    const handleCheckpoint = () => {
      setCheckpoints(getCheckpoints());
    };
    const handleState = (e: CustomEvent<WidgetDebugState>) => {
      setState(e.detail);
    };

    window.addEventListener('widget-debug-checkpoint', handleCheckpoint);
    window.addEventListener('widget-debug-state', handleState as EventListener);

    return () => {
      window.removeEventListener('widget-debug-checkpoint', handleCheckpoint);
      window.removeEventListener('widget-debug-state', handleState as EventListener);
    };
  }, []);

  if (!isWidgetDebugEnabled()) return null;

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`;
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          top: 4,
          right: 4,
          zIndex: 99999,
          background: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          padding: '2px 6px',
          fontSize: 10,
          cursor: 'pointer',
        }}
      >
        DBG
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 4,
        right: 4,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.9)',
        color: '#22c55e',
        fontFamily: 'monospace',
        fontSize: 9,
        padding: 6,
        borderRadius: 4,
        maxWidth: 280,
        maxHeight: 200,
        overflow: 'auto',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <strong style={{ color: '#fbbf24' }}>WIDGET DEBUG</strong>
        <button
          onClick={() => setIsVisible(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: 10,
          }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ marginBottom: 4, borderBottom: '1px solid #333', paddingBottom: 4 }}>
        <div>chatUser: <span style={{ color: state.chatUser ? '#22c55e' : '#ef4444' }}>{String(state.chatUser)}</span></div>
        <div>convId: <span style={{ color: '#60a5fa' }}>{state.activeConversationId || 'null'}</span></div>
        {state.lastError && <div style={{ color: '#ef4444' }}>err: {state.lastError}</div>}
      </div>

      <div style={{ fontSize: 8 }}>
        {checkpoints.slice(-10).map((cp, i) => (
          <div key={i} style={{ marginBottom: 2 }}>
            <span style={{ color: '#9ca3af' }}>{formatTime(cp.timestamp)}</span>{' '}
            <span style={{ color: cp.id.includes('ERR') ? '#ef4444' : '#22c55e' }}>{cp.id}</span>
            {cp.data && Object.keys(cp.data).length > 0 && (
              <span style={{ color: '#60a5fa', marginLeft: 4 }}>
                {JSON.stringify(cp.data).slice(0, 40)}
              </span>
            )}
          </div>
        ))}
        {checkpoints.length === 0 && (
          <div style={{ color: '#9ca3af' }}>No checkpoints yet...</div>
        )}
      </div>
    </div>
  );
}
