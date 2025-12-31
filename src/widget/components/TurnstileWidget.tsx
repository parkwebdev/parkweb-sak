/**
 * TurnstileWidget Component
 * 
 * Cloudflare Turnstile bot protection widget for the contact form.
 * Uses 'interaction-only' mode for invisible verification unless suspicious.
 * 
 * @module widget/components/TurnstileWidget
 */

import { useEffect, useRef, useState } from 'react';

/** Props for the TurnstileWidget component */
interface TurnstileWidgetProps {
  /** Cloudflare Turnstile site key */
  siteKey: string;
  /** Callback when verification succeeds with token */
  onVerify: (token: string) => void;
  /** Optional callback on verification error */
  onError?: () => void;
  /** Optional callback when token expires */
  onExpire?: () => void;
}

/** Turnstile widget render options */
interface TurnstileOptions {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  appearance: 'interaction-only' | 'always' | 'execute';
  theme: 'auto' | 'light' | 'dark';
  size: 'normal' | 'compact' | 'invisible';
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

/**
 * Cloudflare Turnstile widget for bot protection.
 * Loads the Turnstile script and renders an invisible verification widget.
 * 
 * @param props - Component props
 * @returns Turnstile container div (invisible unless challenge needed)
 */
export const TurnstileWidget = ({ 
  siteKey, 
  onVerify, 
  onError,
  onExpire 
}: TurnstileWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Skip if no site key provided
    if (!siteKey) {
      console.debug('Turnstile: No site key provided, skipping');
      return;
    }

    const initTurnstile = () => {
      if (containerRef.current && window.turnstile && !widgetIdRef.current) {
        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: onVerify,
            'error-callback': onError,
            'expired-callback': onExpire,
            appearance: 'interaction-only', // Invisible unless suspicious
            theme: 'auto',
            size: 'normal',
          });
          widgetIdRef.current = id;
          setIsLoaded(true);
          console.debug('Turnstile: Widget rendered successfully');
        } catch (err) {
          console.error('Turnstile: Failed to render widget', err);
          onError?.();
        }
      }
    };

    // Load Turnstile script if not already loaded
    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad';
      script.async = true;
      script.defer = true;
      
      window.onTurnstileLoad = () => {
        console.debug('Turnstile: Script loaded');
        initTurnstile();
      };
      
      document.head.appendChild(script);
    } else if (window.turnstile) {
      // Script already loaded, initialize directly
      initTurnstile();
    } else {
      // Script loading, set callback
      window.onTurnstileLoad = initTurnstile;
    }

    return () => {
      // Cleanup widget on unmount
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        } catch (err) {
          console.debug('Turnstile: Cleanup error (expected if already removed)', err);
        }
      }
    };
  }, [siteKey, onVerify, onError, onExpire]);

  // Don't render anything if no site key
  if (!siteKey) {
    return null;
  }

  return (
    <div 
      ref={containerRef} 
      className="turnstile-container"
      data-turnstile-loaded={isLoaded}
    />
  );
};
