import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ChevronSelectorVertical, CheckCircle, Plus, Settings01, UserPlus01 } from '@untitledui/icons';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrgBranding } from '@/hooks/useOrgBranding';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSidebar } from '@/hooks/use-sidebar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const WorkspaceSwitcher = () => {
  const { currentOrg, organizations, switchOrganization } = useOrganization();
  const { branding } = useOrgBranding();
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [orgLogos, setOrgLogos] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const fetchOrgData = async () => {
      const counts: Record<string, number> = {};
      const logos: Record<string, string | null> = {};
      
      for (const org of organizations) {
        // Fetch member count
        const { count, error } = await supabase
          .from('org_members')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', org.id);
        
        if (!error && count !== null) {
          counts[org.id] = count;
        }

        // Fetch branding/logo
        const { data: brandingData } = await supabase
          .from('org_branding')
          .select('logo_url')
          .eq('org_id', org.id)
          .maybeSingle();
        
        logos[org.id] = brandingData?.logo_url || null;
      }
      
      setMemberCounts(counts);
      setOrgLogos(logos);
    };

    if (organizations.length > 0) {
      fetchOrgData();
    }
  }, [organizations]);

  // Update current org logo when branding changes
  useEffect(() => {
    if (currentOrg?.id && branding?.logo_url !== undefined) {
      setOrgLogos(prev => ({
        ...prev,
        [currentOrg.id]: branding.logo_url
      }));
    }
  }, [currentOrg?.id, branding?.logo_url]);

  if (!currentOrg) {
    return null;
  }

  const hasMultipleWorkspaces = organizations.length > 1;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`w-full justify-start gap-2 h-auto bg-muted/50 hover:bg-muted ${
            isCollapsed ? 'px-1.5 py-1.5' : 'px-2 py-1.5'
          }`}
        >
          <Avatar className="h-4 w-4 rounded-md flex-shrink-0">
            <AvatarImage src={branding?.logo_url || undefined} />
            <AvatarFallback className="rounded-md bg-background text-foreground text-[10px]">
              {currentOrg.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left font-medium truncate text-sm">
                {currentOrg.name}
              </span>
              <ChevronSelectorVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-[280px] bg-background border shadow-lg z-50"
      >
        {hasMultipleWorkspaces && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Switch Workspace
            </DropdownMenuLabel>
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => switchOrganization(org.id)}
                className="flex items-center justify-between cursor-pointer py-2.5 px-3"
              >
                <div className="flex items-center gap-3 truncate flex-1">
                  <Avatar className="h-7 w-7 rounded-md flex-shrink-0">
                    <AvatarImage src={orgLogos[org.id] || undefined} />
                    <AvatarFallback className="rounded-md bg-muted text-foreground text-xs">
                      {org.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate text-sm font-medium">{org.name}</span>
                    {memberCounts[org.id] !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {memberCounts[org.id]} {memberCounts[org.id] === 1 ? 'member' : 'members'}
                      </span>
                    )}
                  </div>
                </div>
                {currentOrg.id === org.id && (
                  <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}
        
        {!hasMultipleWorkspaces && (
          <>
            <div className="px-3 py-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">You have one workspace</p>
              <p className="text-xs text-muted-foreground">
                Create additional workspaces to organize your projects
              </p>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Quick Actions
        </DropdownMenuLabel>
        
        <DropdownMenuItem 
          className="cursor-pointer py-2.5 px-3"
          onClick={() => navigate('/settings?tab=organization')}
        >
          <div className="flex items-center gap-3 w-full">
            <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
              <Settings01 className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm">Workspace Settings</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="cursor-pointer py-2.5 px-3"
          onClick={() => navigate('/settings?tab=team')}
        >
          <div className="flex items-center gap-3 w-full">
            <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
              <UserPlus01 className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm">Invite Members</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-pointer py-2.5 px-3">
          <div className="flex items-center gap-3 w-full">
            <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
              <Plus className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm">Create New Workspace</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
