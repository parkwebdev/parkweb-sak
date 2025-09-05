import React, { useState } from 'react';
import { Home, BarChart3, FolderOpen, Folder, ChevronDown } from 'lucide-react';
import { SearchInput } from './SearchInput';
import { Badge } from './Badge';
import { UserAccountCard } from './UserAccountCard';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  isActive?: boolean;
  badge?: string;
  hasDropdown?: boolean;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    isActive: false
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    isActive: true
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: FolderOpen,
    isActive: false
  }
];

const folderItems = [
  { id: 'view-all', label: 'View all', badge: '18' },
  { id: 'recent', label: 'Recent', badge: '8' },
  { id: 'favorites', label: 'Favorites', badge: '6' },
  { id: 'shared', label: 'Shared', badge: '4' }
];

const bottomItems: NavigationItem[] = [];

export const Sidebar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [foldersExpanded, setFoldersExpanded] = useState(true);

  const toggleFolders = () => {
    setFoldersExpanded(!foldersExpanded);
  };

  return (
    <aside className="items-stretch flex w-[296px] h-screen bg-muted/20 p-1">
      <div className="border shadow-sm w-full flex-1 bg-card rounded-xl border-border">
        <nav className="w-full gap-5 pt-5">
          <header className="w-full whitespace-nowrap gap-5 px-5 py-0">
            <div className="flex min-h-[27px] w-[139px] max-w-full" />
            <div className="w-full gap-2 mt-5">
              <SearchInput
                placeholder="Search"
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>
          </header>

          <div className="w-full mt-5">
            <section className="w-full px-4 py-0">
              {navigationItems.map((item) => (
                <div key={item.id} className="items-center flex w-full overflow-hidden px-0 py-0.5">
                  <button className={`items-center flex w-full gap-3 flex-1 shrink basis-[0%] my-auto px-3 py-2 rounded-md ${
                    item.isActive ? 'bg-accent' : 'bg-transparent hover:bg-accent/50'
                  }`}>
                    <div className="items-center flex w-full gap-2 flex-1 shrink basis-[0%] my-auto">
                      <div className="items-center flex w-[22px] my-auto pr-0.5">
                        <item.icon size={16} className="self-stretch my-auto" />
                      </div>
                      <div className={`text-[14px] font-medium leading-5 self-stretch my-auto ${
                        item.isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {item.label}
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </section>

            <div className="items-stretch flex w-full flex-col justify-center px-5 py-2">
              <div className="border min-h-px w-full bg-border border-border border-solid" />
            </div>

            <section className="w-full px-4 py-0">
              <div className="w-full">
                <div className="items-center flex w-full overflow-hidden px-0 py-0.5">
                  <button
                    onClick={toggleFolders}
                    className="items-center flex w-full gap-3 flex-1 shrink basis-[0%] bg-transparent my-auto px-3 py-2 rounded-md hover:bg-accent/50"
                  >
                    <div className="items-center flex gap-2 flex-1 shrink basis-[0%] my-auto">
                      <div className="items-center flex w-[22px] my-auto pr-0.5">
                        <Folder size={16} />
                      </div>
                      <div className="text-muted-foreground text-[14px] font-medium leading-5 self-stretch my-auto">
                        Folders
                      </div>
                    </div>
                    <ChevronDown size={14} className={`transition-transform ${foldersExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                {foldersExpanded && (
                  <div className="w-full pb-1">
                    {folderItems.map((item) => (
                      <div key={item.id} className="items-center flex w-full overflow-hidden px-0 py-0.5">
                        <button className="items-center flex w-full gap-3 flex-1 shrink basis-[0%] bg-transparent my-auto pl-[42px] pr-3 py-2 rounded-md hover:bg-accent/50 max-md:pl-5">
                          <div className="items-center flex gap-2 text-[14px] text-muted-foreground font-medium flex-1 shrink basis-4 my-auto">
                            <div className="text-muted-foreground text-[14px] leading-5 self-stretch my-auto">
                              {item.label}
                            </div>
                          </div>
                          <Badge>
                            <div className="text-foreground text-xs leading-[18px] self-stretch my-auto">
                              {item.badge}
                            </div>
                          </Badge>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <div className="items-stretch flex w-full flex-col justify-center px-5 py-2">
              <div className="border min-h-px w-full bg-border border-border border-solid" />
            </div>

          </div>
        </nav>

        <footer className="absolute bottom-0 left-0 right-0 gap-4 pt-0 pb-4 px-4">
          <UserAccountCard />
        </footer>
      </div>
    </aside>
  );
};
