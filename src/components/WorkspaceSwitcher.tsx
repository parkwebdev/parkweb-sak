import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronSelectorVertical, CheckCircle } from '@untitledui/icons';
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

  const WorkspaceButton = (
    <Button
      variant="ghost"
      className={`w-full justify-start gap-3 h-auto bg-muted/50 hover:bg-muted ${
        isCollapsed ? 'px-2 py-2' : 'px-3 py-2'
      }`}
    >
      <Avatar className={`${isCollapsed ? 'h-8 w-8' : 'h-8 w-8'} rounded-lg flex-shrink-0`}>
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
          {hasMultipleWorkspaces && (
            <ChevronSelectorVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </>
      )}
    </Button>
  );

  if (!hasMultipleWorkspaces) {
    return WorkspaceButton;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {WorkspaceButton}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-[260px] bg-background z-50"
      >
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
