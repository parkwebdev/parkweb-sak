import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Building02, CheckCircle } from '@untitledui/icons';
import { useOrganization } from '@/contexts/OrganizationContext';

export const OrganizationSwitcher = () => {
  const { currentOrg, organizations, switchOrganization } = useOrganization();

  if (!currentOrg || organizations.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between bg-background hover:bg-accent"
        >
          <div className="flex items-center gap-2 truncate">
            <Building02 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{currentOrg.name}</span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-[240px] bg-background z-50"
      >
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => switchOrganization(org.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <Building02 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{org.name}</span>
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
