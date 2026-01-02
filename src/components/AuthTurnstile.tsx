/**
 * AuthTurnstile Component
 * 
 * Cloudflare Turnstile bot protection widget for authentication forms.
 * Uses 'interaction-only' mode for invisible verification unless suspicious.
 * Separate from widget TurnstileWidget to maintain bundle isolation.
 * 
 * @module components/AuthTurnstile
 */

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

/** Turnstile site key - hardcoded to avoid VITE_ variable issues */
const TURNSTILE_SITE_KEY = '0x4AAAAAACJ7x_wAksJmFwC2';

/** Props for the AuthTurnstile component */
interface AuthTurnstileProps {
  /** Callback when verification succeeds with token */
  onVerify: (token: string) => void;
  /** Optional callback on verification error */
  onError?: () => void;
  /** Optional callback when token expires */
  onExpire?: () => void;
}

/** Ref methods exposed by AuthTurnstile */
export interface AuthTurnstileRef {
  reset: () => void;
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
 * Cloudflare Turnstile widget for auth form bot protection.
 * Exposes a reset() method via ref for resetting after form submission.
 */
export const AuthTurnstile = forwardRef<AuthTurnstileRef, AuthTurnstileProps>(
  ({ onVerify, onError, onExpire }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Expose reset method to parent
    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.reset(widgetIdRef.current);
          } catch (err) {
            console.debug('AuthTurnstile: Reset error', err);
          }
        }
      }
    }));

    useEffect(() => {
      const initTurnstile = () => {
        if (containerRef.current && window.turnstile && !widgetIdRef.current) {
          try {
            const id = window.turnstile.render(containerRef.current, {
              sitekey: TURNSTILE_SITE_KEY,
              callback: onVerify,
              'error-callback': onError,
              'expired-callback': onExpire,
              appearance: 'interaction-only',
              theme: 'auto',
              size: 'normal',
            });
            widgetIdRef.current = id;
            setIsLoaded(true);
            console.debug('AuthTurnstile: Widget rendered successfully');
          } catch (err) {
            console.error('AuthTurnstile: Failed to render widget', err);
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
          console.debug('AuthTurnstile: Script loaded');
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
            console.debug('AuthTurnstile: Cleanup error', err);
          }
        }
      };
    }, [onVerify, onError, onExpire]);

    return (
      <div 
        ref={containerRef} 
        className="flex justify-center"
        data-turnstile-loaded={isLoaded}
      />
    );
  }
);

AuthTurnstile.displayName = 'AuthTurnstile';
