import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronSelectorVertical, CheckCircle, Plus } from '@untitledui/icons';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useOrgBranding } from '@/hooks/useOrgBranding';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSidebar } from '@/hooks/use-sidebar';

export const WorkspaceSwitcher = () => {
  const { currentOrg, organizations, switchOrganization } = useOrganization();
  const { branding } = useOrgBranding();
  const { isCollapsed } = useSidebar();

  if (!currentOrg) {
    return null;
  }

  const hasMultipleWorkspaces = organizations.length > 1;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 h-auto bg-muted/50 hover:bg-muted ${
            isCollapsed ? 'px-2 py-2' : 'px-3 py-2'
          }`}
        >
          <Avatar className="h-8 w-8 rounded-lg flex-shrink-0">
            <AvatarImage src={branding?.logo_url || undefined} />
            <AvatarFallback className="rounded-lg bg-background text-foreground">
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
        className="w-[260px] bg-background z-50"
      >
        {hasMultipleWorkspaces ? (
          <>
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => switchOrganization(org.id)}
                className="flex items-center justify-between cursor-pointer py-2"
              >
                <div className="flex items-center gap-3 truncate flex-1">
                  <Avatar className="h-6 w-6 rounded-md flex-shrink-0">
                    <AvatarFallback className="rounded-md bg-muted text-foreground text-xs">
                      {org.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm">{org.name}</span>
                </div>
                {currentOrg.id === org.id && (
                  <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          <div className="px-3 py-6 text-center">
            <p className="text-sm text-muted-foreground mb-1">You have one workspace</p>
            <p className="text-xs text-muted-foreground">
              Create additional workspaces to organize your projects
            </p>
          </div>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-pointer py-2">
          <div className="flex items-center gap-3 w-full">
            <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
              <Plus className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm">Create New Workspace</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
