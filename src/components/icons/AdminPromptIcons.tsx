/**
 * Admin Prompt Icons
 * 
 * Filled/active variants for admin prompt section menu.
 * @module components/icons/AdminPromptIcons
 */

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * User filled icon (Identity section)
 */
export function UserFilled({ size = 24, className }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="currentColor"
      className={className}
    >
      <circle cx="12" cy="8" r="4" />
      <ellipse cx="12" cy="18" rx="7" ry="4" />
    </svg>
  );
}

/**
 * Message filled icon (Formatting section)
 */
export function MessageFilled({ size = 24, className }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="currentColor"
      className={className}
    >
      <path d="M3 6.5C3 4.567 4.567 3 6.5 3h11C19.433 3 21 4.567 21 6.5v7c0 1.933-1.567 3.5-3.5 3.5H8.5l-4.293 4.293A1 1 0 0 1 2.5 20.5V6.5C2.5 5.119 3.619 4 5 4h12.5C18.881 4 20 5.119 20 6.5v7c0 1.381-1.119 2.5-2.5 2.5h-9l-5.5 5.5V6.5Z" />
      <path d="M3 7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9l-4.293 4.293A1 1 0 0 1 3 21.586V7Z" />
    </svg>
  );
}

/**
 * Shield filled icon (Security section)
 */
export function ShieldFilled({ size = 24, className }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="currentColor"
      className={className}
    >
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3Zm-1 12.59-2.29-2.3-1.42 1.42 3.71 3.7 6.71-6.7-1.42-1.42-5.29 5.3Z" />
    </svg>
  );
}

/**
 * Globe filled icon (Language section)
 */
export function GlobeFilled({ size = 24, className }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="currentColor"
      className={className}
    >
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm1 2.07c2.125.5 3.888 1.955 4.868 3.93H13V4.07Zm-2 0V8H6.132c.98-1.975 2.743-3.43 4.868-3.93ZM6.132 16H11v3.93c-2.125-.5-3.888-1.955-4.868-3.93ZM13 19.93V16h4.868c-.98 1.975-2.743 3.43-4.868 3.93ZM4.2 14H11v-4H4.2c-.13.644-.2 1.313-.2 2 0 .687.07 1.356.2 2Zm15.6 0c.13-.644.2-1.313.2-2 0-.687-.07-1.356-.2-2H13v4h6.8Z" />
    </svg>
  );
}
