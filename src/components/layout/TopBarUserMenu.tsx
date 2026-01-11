/**
 * @fileoverview TopBar User Menu Component
 * Compact avatar trigger with full dropdown menu functionality.
 * Displays in the TopBar on every page.
 */

import { useState, useEffect } from 'react';
import { LogOut01 as LogOut, Users01, Keyboard01, CreditCard01, BookOpen01 } from '@untitledui/icons';
import { 
  Settings02Icon, 
  UserCircleIcon,
  PieChart03Icon,
} from '@/components/ui/settings-icon';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCanManageChecker } from '@/hooks/useCanManage';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/utils/logger';
import { Badge } from '@/components/ui/badge';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';

/** User profile data from database */
interface UserProfile {
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
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
  { key: 't', altKey: true, description: 'Theme' },
  { key: 'a', altKey: true, description: 'Ari' },
  { key: 'c', altKey: true, description: 'Inbox' },
  { key: 'l', altKey: true, description: 'Leads' },
  { key: 'y', altKey: true, description: 'Analytics' },
  { key: 'p', altKey: true, description: 'Planner' },
  { key: 's', altKey: true, description: 'Settings' },
  { key: 'h', altKey: true, description: 'Help Center' },
];

const formatShortcut = (shortcut: KeyboardShortcut): string[] => {
  const keys: string[] = [];
  if (shortcut.ctrlKey) keys.push('⌘');
  if (shortcut.altKey) keys.push('Alt');
  if (shortcut.shiftKey) keys.push('⇧');
  keys.push(shortcut.key.toUpperCase());
  return keys;
};

/**
 * Compact user menu for the TopBar with avatar trigger and full dropdown.
 */
export function TopBarUserMenu() {
  const { user, signOut } = useAuth();
  const canView = useCanManageChecker();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleDropdownOpenChange = (open: boolean) => {
    setIsDropdownOpen(open);
    if (!open) {
      setShowShortcuts(false);
    }
  };

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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      toast.error("Error", {
        description: "Failed to sign out. Please try again.",
      });
    }
  };

  if (!user || loading) {
    return <Skeleton className="h-7 w-7 rounded-full" />;
  }

  const displayName = profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || '';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <DropdownMenu onOpenChange={handleDropdownOpenChange}>
      <DropdownMenuTrigger asChild>
        <button 
          className="relative flex items-center justify-center hover:opacity-80 transition-opacity duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
          aria-label="User menu"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="font-medium text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="bg-status-active absolute rounded-full border-[1.5px] border-background w-2.5 h-2.5 bottom-0 right-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        side="bottom"
        align="end"
        sideOffset={8}
        className="bg-popover border shadow-lg z-50 transition-all duration-200 ease-out rounded-xl"
        style={{ width: showShortcuts ? '400px' : '192px' }}
      >
        <div className="flex">
          {/* Main menu column */}
          <div className={`${showShortcuts ? 'w-[160px]' : 'w-full'} flex-shrink-0`}>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Account</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings?tab=profile" className="w-full flex items-center gap-2 cursor-pointer">
                <UserCircleIcon size={15} />
                Profile
              </Link>
            </DropdownMenuItem>
            {canView('view_team') && (
              <DropdownMenuItem asChild>
                <Link to="/settings?tab=team" className="w-full flex items-center gap-2 cursor-pointer">
                  <Users01 size={15} />
                  Team
                </Link>
              </DropdownMenuItem>
            )}
            {canView('view_billing') && (
              <DropdownMenuItem asChild>
                <Link to="/settings?tab=usage" className="w-full flex items-center gap-2 cursor-pointer">
                  <PieChart03Icon size={15} />
                  Usage
                </Link>
              </DropdownMenuItem>
            )}
            {canView('view_billing') && (
              <DropdownMenuItem asChild>
                <Link to="/settings?tab=billing" className="w-full flex items-center gap-2 cursor-pointer">
                  <CreditCard01 size={15} />
                  Billing
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link to="/settings" className="w-full flex items-center gap-2 cursor-pointer">
                <Settings02Icon size={15} />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/knowledge-base" className="w-full flex items-center gap-2 cursor-pointer">
                <BookOpen01 size={15} />
                Help Center
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onMouseEnter={() => setShowShortcuts(true)}
              className="flex items-center gap-2 cursor-default"
              onSelect={(e) => e.preventDefault()}
            >
              <Keyboard01 size={15} />
              Shortcuts
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <div className="text-xs text-muted-foreground mb-1.5">Theme</div>
              <ThemeSwitcher />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
              <LogOut size={15} className="mr-2" />
              Sign Out
            </DropdownMenuItem>
          </div>

          {/* Shortcuts column - shows on hover */}
          {showShortcuts && (
            <div 
              className="border-l border-border animate-fade-in flex-1"
              onMouseLeave={() => setShowShortcuts(false)}
            >
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Shortcuts</div>
              <DropdownMenuSeparator />
              <div className="space-y-1 px-2 py-1">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between w-full py-0.5">
                    <span className="text-xs text-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-0.5 ml-auto">
                      {formatShortcut(shortcut).map((key, keyIndex) => (
                        <Badge 
                          key={keyIndex}
                          variant="secondary" 
                          size="sm"
                          className="px-1.5 py-0 font-mono text-2xs h-auto rounded-sm"
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
}
