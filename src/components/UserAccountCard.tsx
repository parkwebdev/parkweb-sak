import React from 'react';
import { User01 as User, Settings04 as Settings, LogOut01 as LogOut, CreditCard01 } from '@untitledui/icons';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/lib/toast';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KeyboardShortcutsDropdown } from '@/components/KeyboardShortcutsDropdown';
import { Spinner } from '@/components/ui/spinner';
import { logger } from '@/utils/logger';

interface UserProfile {
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface UserAccountCardProps {
  isCollapsed?: boolean;
}

export const UserAccountCard: React.FC<UserAccountCardProps> = ({ isCollapsed = false }) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
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
      <div className="relative flex w-full gap-3 bg-card rounded-xl p-2 border shadow-sm border-border">
        <Spinner size="sm" />
      </div>
    );
  }

  const displayName = profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
  const email = profile?.email || user.email || '';
  const avatarUrl = profile?.avatar_url || '';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="relative flex w-full bg-card rounded-xl p-2 border shadow-sm border-border overflow-hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 flex-1 min-w-0 p-1 -m-1 hover:bg-accent/50 rounded-lg transition-colors">
            <div className="relative flex-shrink-0">
              <Avatar className="h-7 w-7">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="font-medium text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="bg-green-500 absolute rounded-full border-2 border-background w-2 h-2 -bottom-0 -right-0" />
            </div>
            <div 
              className="text-left min-w-0 flex-1 overflow-hidden"
              style={{ opacity: isCollapsed ? 0 : 1, transition: 'opacity 0.15s ease' }}
            >
              <div className="text-foreground text-xs font-semibold leading-5 truncate">
                {displayName}
              </div>
              <div className="text-muted-foreground text-[11px] font-normal leading-5 truncate">
                {email}
              </div>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-background border shadow-lg z-50">
            <DropdownMenuItem asChild>
              <Link to="/settings?tab=profile" className="w-full flex items-center gap-2">
                <User size={16} />
                Profile
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
            <KeyboardShortcutsDropdown />
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
            <LogOut size={16} className="mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
