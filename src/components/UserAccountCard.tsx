/**
 * UserAccountCard Component
 * 
 * Displays the current user's avatar, name, and email in the sidebar.
 * Includes a dropdown menu with navigation to profile, billing, settings,
 * keyboard shortcuts, and sign out functionality.
 * 
 * @component
 * @example
 * <UserAccountCard isCollapsed={false} />
 */

import React, { useState } from 'react';
import { User01 as User, Settings04 as Settings, LogOut01 as LogOut, CreditCard01, Users01, Keyboard01 } from '@untitledui/icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import { logger } from '@/utils/logger';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

/** User profile data from database */
interface UserProfile {
  /** Display name */
  display_name: string | null;
  /** Email address */
  email: string | null;
  /** Avatar image URL */
  avatar_url: string | null;
}

/** Props for the UserAccountCard component */
interface UserAccountCardProps {
  /** Whether the sidebar is collapsed (shows avatar only) */
  isCollapsed?: boolean;
}

/** Keyboard shortcut definition */
interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  description: string;
}

const shortcuts: KeyboardShortcut[] = [
  { key: 'k', ctrlKey: true, description: 'Global Search' },
  { key: 'd', altKey: true, description: 'Dashboard' },
  { key: 'a', altKey: true, description: 'Ari' },
  { key: 'c', altKey: true, description: 'Inbox' },
  { key: 'l', altKey: true, description: 'Leads' },
  { key: 'y', altKey: true, description: 'Analytics' },
  { key: 'p', altKey: true, description: 'Planner' },
  { key: 's', altKey: true, description: 'Settings' },
];

const formatShortcut = (shortcut: KeyboardShortcut) => {
  const keys = [];
  if (shortcut.ctrlKey) keys.push('⌘');
  if (shortcut.altKey) keys.push('Alt');
  if (shortcut.shiftKey) keys.push('⇧');
  keys.push(shortcut.key.toUpperCase());
  return keys;
};

export const UserAccountCard: React.FC<UserAccountCardProps> = ({ isCollapsed = false }) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, email, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (error) {
        logger.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      logger.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out", {
        description: "You have been signed out successfully.",
      });
      navigate('/login');
    } catch (error) {
      toast.error("Error", {
        description: "Failed to sign out. Please try again.",
      });
    }
  };

  if (!user || loading) {
    return (
      <div className="relative flex w-full gap-3 p-[11px] rounded-md">
        <Spinner size="sm" />
      </div>
    );
  }

  const displayName = profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
  const email = profile?.email || user.email || '';
  const avatarUrl = profile?.avatar_url || '';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <DropdownMenu onOpenChange={(open) => !open && setShowShortcuts(false)}>
      <DropdownMenuTrigger asChild>
        <button className={`relative flex items-center w-full ${isCollapsed ? 'justify-center p-[6px]' : 'gap-3 p-[11px]'} hover:bg-accent/50 rounded-md transition-all duration-150`}>
          <div className="relative flex-shrink-0">
            <Avatar className="h-7 w-7">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="font-medium text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="bg-green-500 absolute rounded-full border-[1.5px] border-sidebar w-2.5 h-2.5 bottom-0 right-0" />
          </div>
          {!isCollapsed && (
            <div className="text-left min-w-0 flex-1 overflow-hidden">
              <div className="text-foreground text-xs font-semibold leading-tight truncate">
                {displayName}
              </div>
              <div className="text-muted-foreground text-2xs font-normal leading-tight truncate">
                {email}
              </div>
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-background border shadow-lg z-50 transition-all duration-200 ease-out"
        style={{ width: showShortcuts ? '400px' : '192px' }}
      >
        <div className="flex">
          {/* Main menu column */}
          <div className={`${showShortcuts ? 'w-[160px]' : 'w-full'} flex-shrink-0`}>
            <DropdownMenuItem asChild>
              <Link to="/settings?tab=profile" className="w-full flex items-center gap-2">
                <User size={16} />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings?tab=team" className="w-full flex items-center gap-2">
                <Users01 size={16} />
                Team
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings?tab=billing" className="w-full flex items-center gap-2">
                <CreditCard01 size={16} />
                Billing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="w-full flex items-center gap-2">
                <Settings size={16} />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onMouseEnter={() => setShowShortcuts(true)}
              className="flex items-center gap-2 cursor-default"
              onSelect={(e) => e.preventDefault()}
            >
              <Keyboard01 size={16} />
              Shortcuts
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut size={16} className="mr-2" />
              Sign Out
            </DropdownMenuItem>
          </div>

          {/* Shortcuts column - shows on hover */}
          {showShortcuts && (
            <div 
              className="border-l border-border pl-3 pr-3 py-2 animate-fade-in flex-1"
              onMouseLeave={() => setShowShortcuts(false)}
            >
              <div className="text-xs font-semibold text-muted-foreground mb-2">Shortcuts</div>
              <div className="space-y-2">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between w-full">
                    <span className="text-xs text-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-0.5 ml-auto">
                      {formatShortcut(shortcut).map((key, keyIndex) => (
                        <Badge 
                          key={keyIndex}
                          variant="secondary" 
                          size="sm"
                          className="px-1.5 py-0.5 font-mono text-xs h-auto rounded-sm"
                        >
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
