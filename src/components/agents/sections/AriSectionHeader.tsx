/**
 * AriSectionHeader Component
 * 
 * Consistent header for all Ari configuration sections.
 */

interface AriSectionHeaderProps {
  title: string;
  description?: string;
  extra?: React.ReactNode;
}

export function AriSectionHeader({
  title,
  description,
  extra,
}: AriSectionHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {extra}
        </div>
      </div>
    </div>
  );
}
