/**
 * ImpersonationBanner Component
 * 
 * Visual indicator shown when an admin is impersonating a user.
 * Provides quick access to end impersonation and shows remaining time.
 * 
 * Security features:
 * - Always visible when impersonating
 * - Shows remaining session time
 * - One-click exit button
 * 
 * @module components/admin/ImpersonationBanner
 */

import { AlertTriangle, X } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { useImpersonation } from '@/hooks/admin/useImpersonation';

/**
 * Banner displayed when admin is impersonating a user.
 */
export function ImpersonationBanner() {
  const { 
    isImpersonating, 
    targetUserEmail, 
    targetUserName,
    remainingMinutes,
    endImpersonation,
    isEnding,
  } = useImpersonation();

  if (!isImpersonating) return null;

  const displayName = targetUserName || targetUserEmail || 'Unknown User';
  const isExpiringSoon = remainingMinutes !== null && remainingMinutes <= 5;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        <div className="flex items-center gap-3">
          <AlertTriangle size={16} className="text-amber-600" aria-hidden="true" />
          <span className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-medium">Impersonating:</span>{' '}
            {displayName}
            {targetUserEmail && targetUserName && (
              <span className="text-amber-600 dark:text-amber-400 ml-1">
                ({targetUserEmail})
              </span>
            )}
            {remainingMinutes !== null && (
              <span className={`ml-2 ${isExpiringSoon ? 'text-amber-700 dark:text-amber-300 font-medium' : 'text-amber-600 dark:text-amber-400'}`}>
                • {remainingMinutes > 0 
                    ? `${remainingMinutes} min${remainingMinutes !== 1 ? 's' : ''} remaining` 
                    : 'Expiring soon'}
              </span>
            )}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => endImpersonation()}
          disabled={isEnding}
          className="text-amber-700 hover:text-amber-900 hover:bg-amber-500/20"
        >
          <X size={14} className="mr-1" aria-hidden="true" />
          End Session
        </Button>
      </div>
    </div>
  );
}
