import React, { useState } from 'react';
import { 
  Plus, 
  FilterLines as Filter,
  LayoutGrid01 as LayoutGrid,
  Table,
  Menu01 as Menu
} from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/SearchInput';

interface ClientsHeaderProps {
  onSearch?: (query: string) => void;
  onFilter?: () => void;
  onCreateClient?: () => void;
  viewMode?: "table" | "cards" | "folders";
  onViewModeChange?: (mode: "table" | "cards" | "folders") => void;
  onMenuClick?: () => void;
}

export const ClientsHeader: React.FC<ClientsHeaderProps> = ({
  onSearch,
  onFilter,
  onCreateClient,
  viewMode = "cards",
  onViewModeChange,
  onMenuClick
}) => {
  return (
    <main className="flex-1 bg-muted/30 min-h-screen pt-4 lg:pt-8">
      <header className="w-full font-medium">
        <div className="items-stretch flex w-full flex-col gap-6 px-4 lg:px-8 py-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden flex items-center gap-2"
                onClick={onMenuClick}
              >
                <Menu size={16} />
              </Button>
              <div className="flex-1 sm:flex-none">
                <h1 className="text-xl lg:text-2xl font-semibold text-foreground">Clients</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your client relationships and track all interactions
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onViewModeChange?.("table")}
                  className="h-8 px-2"
                >
                  <Table size={16} />
                </Button>
                <Button
                  variant={viewMode === "cards" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onViewModeChange?.("cards")}
                  className="h-8 px-2"
                >
                  <LayoutGrid size={16} />
                </Button>
              </div>
              <Button 
                onClick={onCreateClient}
                size="sm"
                className="h-8 px-3 text-sm"
              >
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
      </header>
    </main>
  );
};