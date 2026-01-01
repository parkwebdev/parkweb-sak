/**
 * PermissionButton Component
 * 
 * A reusable button wrapper that checks user permissions before rendering.
 * Can either hide the button completely or show it disabled with a tooltip.
 * 
 * @component
 */

import React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import type { AppPermission } from '@/types/team';

export interface PermissionButtonProps extends ButtonProps {
  /** The permission required to enable this button */
  permission: AppPermission;
  /** If true, hides the button completely when permission is denied. If false, shows disabled with tooltip. */
  hideWhenDenied?: boolean;
  /** Custom tooltip message when disabled due to permissions */
  deniedTooltip?: string;
}

export function PermissionButton({
  permission,
  hideWhenDenied = true,
  deniedTooltip = "You don't have permission to perform this action",
  children,
  disabled,
  ...buttonProps
}: PermissionButtonProps) {
  const { hasPermission, isAdmin, loading } = useRoleAuthorization();
  
  // While loading, show button in a neutral state
  if (loading) {
    return (
      <Button {...buttonProps} disabled>
        {children}
      </Button>
    );
  }
  
  const hasAccess = isAdmin || hasPermission(permission);
  
  // If user doesn't have permission and we should hide the button
  if (!hasAccess && hideWhenDenied) {
    return null;
  }
  
  // If user doesn't have permission but we show disabled state
  if (!hasAccess) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>
              <Button {...buttonProps} disabled>
                {children}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{deniedTooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // User has permission, render normally
  return (
    <Button {...buttonProps} disabled={disabled}>
      {children}
    </Button>
  );
}

export default PermissionButton;
