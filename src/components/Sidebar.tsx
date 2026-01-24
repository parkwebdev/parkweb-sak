/**
 * Sidebar Navigation Component
 * 
 * Main navigation sidebar - always expanded at 240px width.
 * Shows unread conversation badges and filters items based on user permissions.
 * Super admins see admin sections when on /admin/* routes.
 * 
 * @module components/Sidebar
 */

import React, { useMemo } from 'react';
import { X, Grid01 as Grid, SearchMd, Shield01, ArrowLeft } from '@untitledui/icons';
import AriAgentsIcon from './icons/AriAgentsIcon';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { useConversations } from '@/hooks/useConversations';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { useUnifiedSearch } from '@/contexts/UnifiedSearchContext';
import { useRoleAuthorization } from '@/hooks/useRoleAuthorization';
import PilotLogo from './PilotLogo';
import { springs } from '@/lib/motion-variants';
import { getMainNavRoutes, getBottomNavRoutes, getRouteById, ADMIN_SECTIONS, type RouteConfig, type AdminSectionConfig } from '@/config/routes';
import { NAVIGATION_ICON_MAP, ACTIVE_ICON_MAP, ADMIN_ICON_MAP, ADMIN_ACTIVE_ICON_MAP } from '@/lib/navigation-icons';
import type { ConversationMetadata } from '@/types/metadata';
import type { AppPermission } from '@/types/team';
import type { AdminPermission } from '@/types/admin';
import { ADMIN_SECTION_PERMISSIONS } from '@/config/admin-permissions';

/**
 * Navigation item configuration
 * @internal
 */
interface NavigationItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Icon component (default state) */
  icon: React.ComponentType<{ size?: number; className?: string }>;
  /** Icon component for active state (optional) */
  activeIcon?: React.ComponentType<{ size?: number; className?: string }>;
  /** Route path */
  path: string;
  /** Optional badge text */
  badge?: string;
  /** Required permission to view this item (optional - if not set, always visible) */
  requiredPermission?: AppPermission;
  /** If true, only admins can see this item */
  adminOnly?: boolean;
}

/** Convert RouteConfig to NavigationItem */
function routeToNavItem(route: RouteConfig): NavigationItem {
  return {
    id: route.id,
    label: route.label,
    icon: NAVIGATION_ICON_MAP[route.iconName ?? ''] ?? Grid,
    activeIcon: ACTIVE_ICON_MAP[route.iconName ?? ''],
    path: route.path,
    requiredPermission: route.requiredPermission,
    adminOnly: route.adminOnly,
  };
}

/** Convert AdminSectionConfig to NavigationItem */
function adminSectionToNavItem(section: AdminSectionConfig): NavigationItem {
  return {
    id: section.id,
    label: section.label,
    icon: ADMIN_ICON_MAP[section.iconName] ?? Grid,
    activeIcon: ADMIN_ACTIVE_ICON_MAP[section.iconName],
    path: section.path,
  };
}

/** Main navigation items from centralized config */
const navigationItems: NavigationItem[] = getMainNavRoutes().map(routeToNavItem);

/** Bottom navigation items from centralized config */
const bottomItems: NavigationItem[] = getBottomNavRoutes().map(routeToNavItem);

/** Admin navigation items from ADMIN_SECTIONS */
const adminNavigationItems: NavigationItem[] = ADMIN_SECTIONS.map(adminSectionToNavItem);

/**
 * Props for the Sidebar component
 */
interface SidebarProps {
  /** Optional callback when mobile close button is clicked */
  onClose?: () => void;
}

/**
 * Application sidebar with navigation links.
 * Features hover-to-expand behavior and unread message badges.
 * Filters navigation based on user permissions.
 * Shows admin sections when super admin is on /admin/* routes.
 * 
 * @example
 * <Sidebar />
 * 
 * @example
 * // Mobile with close button
 * <Sidebar onClose={() => setMobileMenuOpen(false)} />
 */
function SidebarComponent({ onClose }: SidebarProps) {
  const location = useLocation();
  const { conversations } = useConversations();
  const prefersReducedMotion = useReducedMotion();
  const { allComplete, completedCount, totalCount } = useOnboardingProgress();
  const { setOpen: setSearchOpen } = useUnifiedSearch();
  const { hasPermission, hasAdminPermission, isAdmin, isSuperAdmin, isPilotTeamMember, loading: permissionsLoading } = useRoleAuthorization();
  
  // Check if we're on an admin route
  const isOnAdminRoute = location.pathname.startsWith('/admin');
  
  // Filter navigation items based on permissions and add Dashboard dynamically
  const filteredNavigationItems = useMemo(() => {
    if (permissionsLoading) return navigationItems; // Show all while loading
    
    // If pilot team member is on /admin/* routes, show admin navigation filtered by permissions
    if (isPilotTeamMember && isOnAdminRoute) {
      return adminNavigationItems.filter(item => {
        const required = ADMIN_SECTION_PERMISSIONS[item.id];
        if (!required) return true; // No permission required (overview, audit)
        if (isSuperAdmin) return true; // Super admins see everything
        return hasAdminPermission(required);
      });
    }
    
    // Start with filtered main nav items
    const baseItems = navigationItems.filter(item => {
      if (!item.requiredPermission) return true;
      if (isAdmin) return true;
      return hasPermission(item.requiredPermission);
    });
    
    // Add Dashboard at the beginning if onboarding is complete (admin only)
    if (allComplete && isAdmin) {
      const dashboardRoute = getRouteById('dashboard');
      if (dashboardRoute) {
        const dashboardItem = routeToNavItem(dashboardRoute);
        return [dashboardItem, ...baseItems];
      }
    }
    
    return baseItems;
  }, [hasPermission, hasAdminPermission, isAdmin, isSuperAdmin, isPilotTeamMember, isOnAdminRoute, permissionsLoading, allComplete]);

  // Filter bottom items - hide "Get set up" when onboarding is complete
  const filteredBottomItems = useMemo(() => {
    if (permissionsLoading) return bottomItems;
    
    // On admin routes, don't show regular bottom items for pilot team
    if (isPilotTeamMember && isOnAdminRoute) {
      return [];
    }
    
    return bottomItems.filter(item => {
      // Hide "Get set up" when onboarding is complete
      if (item.id === 'get-set-up' && allComplete) {
        return false;
      }
      // Admin-only items require admin status
      if (item.adminOnly) return isAdmin;
      if (!item.requiredPermission) return true;
      if (isAdmin) return true;
      return hasPermission(item.requiredPermission);
    });
  }, [hasPermission, isAdmin, isSuperAdmin, isPilotTeamMember, isOnAdminRoute, permissionsLoading, allComplete]);

  // Count unread conversations for admin notification badge
  const unreadConversationsCount = conversations.filter(conv => {
    const metadata = (conv.metadata || {}) as ConversationMetadata;
    const lastReadAt = metadata?.admin_last_read_at;
    const lastUserMessageAt = metadata?.last_user_message_at;
    const lastMessageAt = metadata?.last_message_at;
    const lastMessageRole = metadata?.last_message_role;
    
    const relevantMessageAt = lastUserMessageAt || 
      (lastMessageRole !== 'human' ? lastMessageAt : null);
    
    if (!relevantMessageAt) return false;
    if (!lastReadAt) return true;
    return new Date(relevantMessageAt) > new Date(lastReadAt);
  }).length;

  return (
    <aside className="flex h-screen w-[240px] bg-background border-r border-border">
      <nav className="w-full flex flex-col pt-6 px-3 pb-4" aria-label="Main navigation">
        {/* Header with logo */}
        <header className="w-full px-2 mb-6">
          <div className="flex items-center justify-between">
            {isPilotTeamMember && isOnAdminRoute ? (
              // Admin mode header
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Shield01 size={14} className="text-destructive" />
                </div>
                <span className="text-sm font-semibold text-foreground">{isSuperAdmin ? 'Super Admin' : 'Admin'}</span>
              </div>
            ) : (
              <PilotLogo className="h-6 w-6 text-foreground flex-shrink-0" />
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {/* Search bar - above main navigation */}
          <motion.div 
            className="items-center flex w-full py-0.5 mb-2"
            initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={springs.smooth}
          >
            <button
              onClick={() => setSearchOpen(true)}
              className="items-center flex w-full px-2.5 py-2 rounded-md transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
            >
              <div className="items-center flex gap-2 my-auto w-full overflow-hidden">
                <SearchMd size={14} className="flex-shrink-0" />
                <span className="text-sm font-normal leading-4 my-auto whitespace-nowrap flex-1 text-left">
                  Search...
                </span>
                <div className="flex items-center gap-0.5 ml-auto">
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center justify-center rounded border border-border bg-background px-1 font-mono text-2xs font-medium text-muted-foreground min-w-[20px]">
                    <span className="text-xs">⌘</span>
                  </kbd>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center justify-center rounded border border-border bg-background px-1 font-mono text-2xs font-medium text-muted-foreground min-w-[20px]">
                    K
                  </kbd>
                </div>
              </div>
            </button>
          </motion.div>

          {/* Main navigation */}
          <section className="w-full">
            {filteredNavigationItems.map((item, index) => {
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              
              return (
                <motion.div 
                  key={item.id} 
                  className="items-center flex w-full py-0.5"
                  initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, ...springs.smooth }}
                >
                  <Link 
                    to={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    className={`items-center flex w-full p-[11px] rounded-md transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                      isActive 
                        ? 'bg-accent text-accent-foreground' 
                        : 'bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="items-center flex gap-2 my-auto w-full">
                      <div className="items-center flex my-auto w-[18px] flex-shrink-0 relative">
                        {isActive && item.activeIcon ? (
                          <item.activeIcon size={14} className="self-stretch my-auto" />
                        ) : (
                          <item.icon size={14} className="self-stretch my-auto" />
                        )}
                      </div>
                      <div className="flex items-center justify-between flex-1 overflow-hidden">
                        <div className={`text-sm font-normal leading-4 my-auto whitespace-nowrap ${
                          isActive ? 'font-medium' : ''
                        }`}>
                          {item.label}
                        </div>
                        {item.id === 'conversations' && unreadConversationsCount > 0 && (
                          <motion.div 
                            className="bg-destructive text-destructive-foreground text-2xs font-semibold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center ml-auto"
                            initial={prefersReducedMotion ? false : { scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={springs.bouncy}
                            role="status"
                            aria-label={`${unreadConversationsCount} unread conversations`}
                          >
                            {unreadConversationsCount}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </section>

        </div>

        {/* Footer with bottom nav items */}
        <div className="pt-4">
          {/* Bottom navigation (get set up, settings) - permission filtered */}
          {filteredBottomItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const isGetSetUp = item.id === 'get-set-up';
            
            // Circular progress for "Get set up"
            const renderIcon = () => {
              if (isGetSetUp) {
                // Show completed badge when all steps done
                if (allComplete) {
                  return (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-status-active">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M2.0315 12C2.0312 11.8662 2.00492 11.7325 1.95265 11.6065L1.23121 9.85975C1.07879 9.49188 1.00006 9.09699 1 8.69879C0.999936 8.30038 1.07838 7.90585 1.23084 7.53776C1.3833 7.16967 1.6068 6.83523 1.88856 6.55355C2.17025 6.27194 2.50465 6.04858 2.87267 5.89623L4.6166 5.17384C4.86916 5.06941 5.0706 4.86887 5.17575 4.61659L5.8983 2.87214C6.20608 2.12905 6.79645 1.53866 7.53953 1.23085C8.28261 0.923049 9.11753 0.923048 9.86061 1.23085L11.6037 1.9529C11.8567 2.05733 12.141 2.0572 12.3938 1.95231L12.3958 1.95149L14.1404 1.23192C14.8832 0.924529 15.7183 0.924429 16.4611 1.23209C17.204 1.53984 17.7943 2.13006 18.1021 2.87295L18.8073 4.57552C18.8136 4.58896 18.8196 4.60259 18.8253 4.61641C18.9298 4.86924 19.1304 5.07024 19.383 5.1753L21.1279 5.8981C21.871 6.20591 22.4614 6.7963 22.7692 7.53939C23.0769 8.28247 23.0769 9.11739 22.7692 9.86048L22.0468 11.6045C21.9943 11.7311 21.9681 11.8661 21.9681 12.0003C21.9681 12.1345 21.9943 12.2689 22.0468 12.3955L22.7692 14.1395C23.0769 14.8826 23.0769 15.7175 22.7692 16.4606C22.4614 17.2037 21.871 17.7941 21.1279 18.1019L19.383 18.8247C19.1304 18.9298 18.9298 19.1308 18.8253 19.3836C18.8196 19.3974 18.8136 19.411 18.8073 19.4245L18.1021 21.127C17.7943 21.8699 17.204 22.4602 16.4611 22.7679C15.7183 23.0756 14.8832 23.0755 14.1404 22.7681L12.3958 22.0485L12.3938 22.0477C12.141 21.9428 11.8567 21.9427 11.6037 22.0471L9.86061 22.7691C9.11753 23.077 8.28261 23.077 7.53953 22.7691C6.79645 22.4613 6.20608 21.8709 5.8983 21.1279L5.17575 19.3834C5.0706 19.1311 4.86916 18.9306 4.6166 18.8262L2.87267 18.1038C2.50465 17.9514 2.17025 17.7281 1.88856 17.4465C1.6068 17.1648 1.3833 16.8303 1.23084 16.4622C1.07838 16.0941 0.999936 15.6996 1 15.3012C1.00006 14.903 1.07879 14.5081 1.23121 14.1402L1.95265 12.3935C2.00492 12.2675 2.0312 12.1338 2.0315 12ZM16.2071 10.2071C16.5976 9.81658 16.5976 9.18342 16.2071 8.79289C15.8166 8.40237 15.1834 8.40237 14.7929 8.79289L11 12.5858L9.70711 11.2929C9.31658 10.9024 8.68342 10.9024 8.29289 11.2929C7.90237 11.6834 7.90237 12.3166 8.29289 12.7071L10.2929 14.7071C10.6834 15.0976 11.3166 15.0976 11.7071 14.7071L16.2071 10.2071Z"
                        fill="currentColor"
                      />
                    </svg>
                  );
                }
                
                // Show progress circle when incomplete
                const progress = totalCount > 0 ? (completedCount / totalCount) : 0;
                const circumference = 2 * Math.PI * 6;
                const strokeDashoffset = circumference * (1 - progress);
                
                return (
                  <svg width="14" height="14" viewBox="0 0 16 16" className="flex-shrink-0">
                    <circle
                      cx="8"
                      cy="8"
                      r="6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-muted-foreground/30"
                    />
                    <circle
                      cx="8"
                      cy="8"
                      r="6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      className="text-status-active"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      transform="rotate(-90 8 8)"
                      style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                    />
                  </svg>
                );
              }
              if (isActive && item.activeIcon) {
                return <item.activeIcon size={14} className="self-stretch my-auto" />;
              }
              return <item.icon size={14} className="self-stretch my-auto" />;
            };
            
            return (
              <motion.div 
                key={item.id}
                className="items-center flex w-full py-0.5"
                initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (filteredNavigationItems.length + 1 + index) * 0.03, ...springs.smooth }}
              >
                <Link 
                  to={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`items-center flex w-full p-[11px] rounded-md transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    isActive 
                      ? 'bg-accent text-accent-foreground' 
                      : 'bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="items-center flex gap-2 my-auto w-full">
                    <div className="items-center flex my-auto w-[18px] flex-shrink-0 justify-center">
                      {renderIcon()}
                    </div>
                    <div className="flex items-center justify-between flex-1 overflow-hidden">
                      <div className={`text-sm font-normal leading-4 my-auto whitespace-nowrap ${
                        isActive ? 'font-medium' : ''
                      }`}>
                        {item.label}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
          
          {/* Back to Dashboard link for admin mode */}
          {isSuperAdmin && isOnAdminRoute && (
            <motion.div 
              className="items-center flex w-full py-0.5 mt-2 pt-2 border-t border-border"
              initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, ...springs.smooth }}
            >
              <Link 
                to="/dashboard"
                className="items-center flex w-full p-[11px] rounded-md transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground"
              >
                <div className="items-center flex gap-2 my-auto w-full">
                  <div className="items-center flex my-auto w-[18px] flex-shrink-0 justify-center">
                    <ArrowLeft size={14} className="self-stretch my-auto" />
                  </div>
                  <div className="text-sm font-normal leading-4 my-auto whitespace-nowrap">
                    Back to Dashboard
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
          
          {/* Admin Dashboard link for super admins when not on admin routes */}
          {isSuperAdmin && !isOnAdminRoute && (
            <motion.div 
              className="items-center flex w-full py-0.5 mt-2 pt-2 border-t border-border"
              initial={prefersReducedMotion ? false : { opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, ...springs.smooth }}
            >
              <Link 
                to="/admin"
                className="items-center flex w-full p-[11px] rounded-md transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground"
              >
                <div className="items-center flex gap-2 my-auto w-full">
                  <div className="items-center flex my-auto w-[18px] flex-shrink-0 justify-center">
                    <Shield01 size={14} className="text-destructive self-stretch my-auto" />
                  </div>
                  <div className="text-sm font-normal leading-4 my-auto whitespace-nowrap">
                    Admin Dashboard
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </nav>
    </aside>
  );
}

/**
 * Memoized Sidebar component to prevent unnecessary re-renders.
 */
export const Sidebar = React.memo(SidebarComponent);
