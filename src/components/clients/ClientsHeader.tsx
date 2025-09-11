import React from 'react';
import { Plus, FilterLines as Filter } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/SearchInput';

interface ClientsHeaderProps {
  onSearch?: (query: string) => void;
  onFilter?: () => void;
  onCreateClient?: () => void;
}

export const ClientsHeader: React.FC<ClientsHeaderProps> = ({
  onSearch,
  onFilter,
  onCreateClient
}) => {
  return (
    <div className="border-b border-border bg-card">
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Clients</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your client relationships and track all interactions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onFilter}>
              <Filter size={16} className="mr-2" />
              Filter
            </Button>
            <Button size="sm" onClick={onCreateClient}>
              <Plus size={16} className="mr-2" />
              Add Client
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <SearchInput 
              placeholder="Search clients..." 
              onChange={onSearch}
            />
          </div>
        </div>
      </div>
    </div>
  );
};