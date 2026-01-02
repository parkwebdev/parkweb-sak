/**
 * AuthTurnstile Component
 * 
 * Cloudflare Turnstile bot protection for authentication forms.
 * Uses 'interaction-only' mode for invisible verification unless suspicious.
 * Exposes a reset() method via ref for resetting after form submissions.
 * 
 * @module components/AuthTurnstile
 */

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

/** Turnstile site key from environment (public key, safe to expose) */
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

/** Props for the AuthTurnstile component */
interface AuthTurnstileProps {
  /** Callback when verification succeeds with token */
  onVerify: (token: string) => void;
  /** Optional callback on verification error */
  onError?: () => void;
  /** Optional callback when token expires */
  onExpire?: () => void;
}

/** Ref handle for AuthTurnstile */
export interface AuthTurnstileRef {
  /** Reset the Turnstile widget to get a new token */
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
 * Cloudflare Turnstile widget for authentication forms.
 * Loads the Turnstile script and renders an invisible verification widget.
 * 
 * @example
 * ```tsx
 * const turnstileRef = useRef<AuthTurnstileRef>(null);
 * 
 * <AuthTurnstile
 *   ref={turnstileRef}
 *   onVerify={(token) => setCaptchaToken(token)}
 *   onError={() => setCaptchaToken(null)}
 *   onExpire={() => setCaptchaToken(null)}
 * />
 * 
 * // Reset after failed auth attempt:
 * turnstileRef.current?.reset();
 * ```
 */
export const AuthTurnstile = forwardRef<AuthTurnstileRef, AuthTurnstileProps>(
  ({ onVerify, onError, onExpire }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Store callbacks in refs to avoid re-render issues
    const onVerifyRef = useRef(onVerify);
    const onErrorRef = useRef(onError);
    const onExpireRef = useRef(onExpire);

    // Keep refs updated
    useEffect(() => {
      onVerifyRef.current = onVerify;
      onErrorRef.current = onError;
      onExpireRef.current = onExpire;
    }, [onVerify, onError, onExpire]);

    // Expose reset method via ref
    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.reset(widgetIdRef.current);
          } catch (err) {
            console.debug('Turnstile: Reset error (expected if not rendered)', err);
          }
        }
      }
    }), []);

    useEffect(() => {
      // Skip if no site key provided
      if (!TURNSTILE_SITE_KEY) {
        console.debug('AuthTurnstile: No site key provided, skipping');
        return;
      }

      const initTurnstile = () => {
        if (containerRef.current && window.turnstile && !widgetIdRef.current) {
          try {
            const id = window.turnstile.render(containerRef.current, {
              sitekey: TURNSTILE_SITE_KEY,
              callback: (token: string) => onVerifyRef.current(token),
              'error-callback': () => onErrorRef.current?.(),
              'expired-callback': () => onExpireRef.current?.(),
              appearance: 'interaction-only', // Invisible unless suspicious
              theme: 'auto',
              size: 'normal',
            });
            widgetIdRef.current = id;
            setIsLoaded(true);
            console.debug('AuthTurnstile: Widget rendered successfully');
          } catch (err) {
            console.error('AuthTurnstile: Failed to render widget', err);
            onErrorRef.current?.();
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
            console.debug('AuthTurnstile: Cleanup error (expected if already removed)', err);
          }
        }
      };
    }, []); // Empty dependency array - only initialize once

    // Don't render anything if no site key
    if (!TURNSTILE_SITE_KEY) {
      return null;
    }

    return (
      <div 
        ref={containerRef} 
        className="auth-turnstile-container"
        data-turnstile-loaded={isLoaded}
      />
    );
  }
);

AuthTurnstile.displayName = 'AuthTurnstile';
