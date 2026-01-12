/**
 * RoleBadge Component
 *
 * Shared component for displaying user role badges with consistent
 * formatting and styling across the admin dashboard.
 *
 * @module components/admin/shared/RoleBadge
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  /** The role value (e.g., "super_admin", "admin", "member") */
  role: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Custom display names for roles that need special formatting.
 * Maps database values to user-friendly display text.
 */
const ROLE_DISPLAY_NAMES: Record<string, string> = {
  member: 'Team Member',
  pilot_team_member: 'Pilot Team',
  pilot_support: 'Pilot Support',
};

/**
 * Format role string to readable text.
 * First checks for custom display names, then falls back to automatic formatting.
 */
function formatRole(role: string): string {
  const lowerRole = role.toLowerCase();

  // Check for custom display name first
  if (ROLE_DISPLAY_NAMES[lowerRole]) {
    return ROLE_DISPLAY_NAMES[lowerRole];
  }

  // Fallback: capitalize each word
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Role-based styling configuration
 */
const ROLE_STYLES: Record<string, string> = {
  super_admin: 'bg-primary/10 text-primary border-primary/20',
  pilot_support: 'bg-status-pending/10 text-status-pending-foreground border-status-pending/20',
  admin: 'bg-status-active/10 text-status-active-foreground border-status-active/20',
  manager: 'bg-status-pending/10 text-status-pending-foreground border-status-pending/20',
  member: 'bg-muted text-muted-foreground border-border',
  client: 'bg-muted text-muted-foreground border-border',
};

/**
 * Role badge component with consistent formatting and styling.
 */
export function RoleBadge({ role, className }: RoleBadgeProps) {
  const styleKey = role.toLowerCase();
  const customStyles = ROLE_STYLES[styleKey];

  return (
    <Badge variant="outline" className={cn(customStyles, className)}>
      {formatRole(role)}
    </Badge>
  );
}
