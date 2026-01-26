/**
 * AdminSectionHeader Component
 * 
 * Section header for admin prompt editing pages.
 * 
 * @module components/admin/prompts/AdminSectionHeader
 */

interface AdminSectionHeaderProps {
  title: string;
  description?: string;
  lastUpdated?: string;
}

export function AdminSectionHeader({
  title,
  description,
  lastUpdated,
}: AdminSectionHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      )}
      {lastUpdated && (
        <p className="text-xs text-muted-foreground mt-1">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </p>
      )}
    </div>
  );
}
