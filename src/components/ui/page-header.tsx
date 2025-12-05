import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Menu01 as Menu } from '@untitledui/icons';

interface PageHeaderProps {
  title: string;
  description?: string;
  onMenuClick?: () => void;
  children?: ReactNode;
}

export const PageHeader = ({
  title,
  description,
  onMenuClick,
  children,
}: PageHeaderProps) => {
  return (
    <header className="w-full font-medium pt-4 lg:pt-8">
      <div className="items-stretch flex w-full flex-col gap-6 px-4 lg:px-8 py-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {onMenuClick && (
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden flex items-center gap-2"
                onClick={onMenuClick}
              >
                <Menu size={16} />
              </Button>
            )}
            <div className="flex-1 sm:flex-none">
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
          {children && <div className="flex gap-2">{children}</div>}
        </div>
      </div>
    </header>
  );
};
