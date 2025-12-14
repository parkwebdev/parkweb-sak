/**
 * Inbox Navigation Sidebar
 * 
 * Left-side navigation for filtering conversations by source/status.
 * Fixed width, not collapsible.
 */

import AriAgentsIcon from '@/components/icons/AriAgentsIcon';
import { CheckCircle, Globe01 } from '@untitledui/icons';
import { cn } from '@/lib/utils';

// Social channel logos (matching AriIntegrationsSection)
const FacebookLogo = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramLogo = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const XLogo = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export type InboxFilter = {
  type: 'all' | 'status' | 'channel';
  value?: string;
  label: string;
};

interface InboxNavSidebarProps {
  activeFilter: InboxFilter;
  onFilterChange: (filter: InboxFilter) => void;
  counts: {
    all: number;
    resolved: number;
    widget: number;
    facebook: number;
    instagram: number;
    x: number;
  };
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
}

function NavItem({ icon, label, count, isActive, onClick, disabled, comingSoon }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
        'hover:bg-accent',
        isActive && 'bg-accent text-accent-foreground font-medium',
        disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
      )}
    >
      <span className="flex-shrink-0 text-muted-foreground">{icon}</span>
      <span className="flex-1 text-left truncate">{label}</span>
      {comingSoon ? (
        <span className="text-2xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Soon</span>
      ) : count !== undefined && count > 0 ? (
        <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
      ) : null}
    </button>
  );
}

export function InboxNavSidebar({ activeFilter, onFilterChange, counts }: InboxNavSidebarProps) {
  const isActive = (type: string, value?: string) => 
    activeFilter.type === type && activeFilter.value === value;

  return (
    <div className="w-48 border-r bg-background flex flex-col">
      {/* Ari Section */}
      <div className="p-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">
          Ari
        </h3>
        <div className="space-y-0.5">
          <NavItem
            icon={<AriAgentsIcon className="h-4 w-4" />}
            label="All Conversations"
            count={counts.all}
            isActive={isActive('all')}
            onClick={() => onFilterChange({ type: 'all', label: 'All Conversations' })}
          />
          <NavItem
            icon={<CheckCircle size={16} />}
            label="Resolved"
            count={counts.resolved}
            isActive={isActive('status', 'closed')}
            onClick={() => onFilterChange({ type: 'status', value: 'closed', label: 'Resolved' })}
          />
        </div>
      </div>

      {/* Channels Section */}
      <div className="p-3 pt-0">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-3">
          Channels
        </h3>
        <div className="space-y-0.5">
          <NavItem
            icon={<Globe01 size={16} />}
            label="Widget"
            count={counts.widget}
            isActive={isActive('channel', 'widget')}
            onClick={() => onFilterChange({ type: 'channel', value: 'widget', label: 'Widget' })}
          />
          <NavItem
            icon={<FacebookLogo />}
            label="Facebook"
            count={counts.facebook}
            isActive={isActive('channel', 'facebook')}
            onClick={() => onFilterChange({ type: 'channel', value: 'facebook', label: 'Facebook' })}
            disabled
            comingSoon
          />
          <NavItem
            icon={<InstagramLogo />}
            label="Instagram"
            count={counts.instagram}
            isActive={isActive('channel', 'instagram')}
            onClick={() => onFilterChange({ type: 'channel', value: 'instagram', label: 'Instagram' })}
            disabled
            comingSoon
          />
          <NavItem
            icon={<XLogo />}
            label="X (Twitter)"
            count={counts.x}
            isActive={isActive('channel', 'x')}
            onClick={() => onFilterChange({ type: 'channel', value: 'x', label: 'X (Twitter)' })}
            disabled
            comingSoon
          />
        </div>
      </div>
    </div>
  );
}
