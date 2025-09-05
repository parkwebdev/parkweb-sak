import React, { useState } from 'react';
import { SearchInput } from './SearchInput';
import { Badge } from './Badge';
import { UserAccountCard } from './UserAccountCard';

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  isActive?: boolean;
  badge?: string;
  hasDropdown?: boolean;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: '🏠',
    isActive: false
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    isActive: true
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: '📁',
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
    <aside className="items-stretch flex min-w-60 h-full w-[296px] bg-background pl-1 pr-0 py-1">
      <div className="border shadow-sm min-w-60 w-full flex-1 shrink basis-[0%] bg-card rounded-xl border-border">
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
                  <button className={`items-center flex min-w-60 w-full gap-3 flex-1 shrink basis-[0%] my-auto px-3 py-2 rounded-md ${
                    item.isActive ? 'bg-accent' : 'bg-transparent hover:bg-accent/50'
                  }`}>
                    <div className="items-center flex w-full gap-2 flex-1 shrink basis-[0%] my-auto">
                      <div className="items-center flex w-[22px] my-auto pr-0.5">
                        <span className="text-lg self-stretch my-auto">{item.icon}</span>
                      </div>
                      <div className={`text-base font-semibold leading-6 self-stretch my-auto ${
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
                    className="items-center flex min-w-60 w-full gap-3 flex-1 shrink basis-[0%] bg-transparent my-auto px-3 py-2 rounded-md hover:bg-accent/50"
                  >
                    <div className="items-center flex gap-2 flex-1 shrink basis-[0%] my-auto">
                      <div className="items-center flex w-[22px] my-auto pr-0.5">
                        <span className="text-lg">📁</span>
                      </div>
                      <div className="text-muted-foreground text-base font-semibold leading-6 self-stretch my-auto">
                        Folders
                      </div>
                    </div>
                    <span className="text-lg">⌄</span>
                  </button>
                </div>
                {foldersExpanded && (
                  <div className="w-full pb-1">
                    {folderItems.map((item) => (
                      <div key={item.id} className="items-center flex w-full overflow-hidden px-0 py-0.5">
                        <button className="items-center flex min-w-60 w-full gap-3 flex-1 shrink basis-[0%] bg-transparent my-auto pl-[42px] pr-3 py-2 rounded-md hover:bg-accent/50 max-md:pl-5">
                          <div className="items-center flex gap-2 text-base text-muted-foreground font-semibold flex-1 shrink basis-4 my-auto">
                            <div className="text-muted-foreground text-base leading-6 self-stretch my-auto">
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

        <footer className="w-full gap-4 mt-[181px] pt-0 pb-4 px-4 max-md:mt-10">
          <UserAccountCard />
        </footer>
      </div>
    </aside>
  );
};
