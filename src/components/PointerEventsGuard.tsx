/**
 * PointerEventsGuard Component
 * 
 * Safety net that detects and fixes orphaned pointer-events locks
 * caused by Radix UI's DismissableLayer failing to clean up.
 * 
 * @module components/PointerEventsGuard
 */

import { useEffect, useRef } from 'react';

export function PointerEventsGuard() {
  const lastFixTime = useRef(0);

  useEffect(() => {
    const checkPointerEvents = () => {
      // If body has pointer-events: none but no Radix modals are open, fix it
      if (document.body.style.pointerEvents !== 'none') return;

      const openPortals = document.querySelectorAll('[data-radix-portal]');
      const hasOpenModal = Array.from(openPortals).some(portal => 
        portal.querySelector('[data-state="open"]')
      );
      
      if (!hasOpenModal) {
        const now = Date.now();
        // Only log once per 2 seconds to reduce console noise
        if (now - lastFixTime.current > 2000) {
          console.warn('[PointerEventsGuard] Fixing orphaned pointer-events lock');
          lastFixTime.current = now;
        }
        document.body.style.pointerEvents = '';
      }
    };

    // Check periodically and on focus (user returning to tab)
    const interval = setInterval(checkPointerEvents, 500);
    window.addEventListener('focus', checkPointerEvents);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkPointerEvents);
    };
  }, []);

  return null;
}
