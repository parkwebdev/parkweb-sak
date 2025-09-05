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
    icon: 'https://api.builder.io/api/v1/image/assets/TEMP/2427d9f57bd95e130ce51d4f080f8c6c0b9e0a45?placeholderIfAbsent=true',
    isActive: false
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'https://api.builder.io/api/v1/image/assets/TEMP/d99c2f1c434455d8dcea5660a829fba413dfbc6e?placeholderIfAbsent=true',
    isActive: true
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: 'https://api.builder.io/api/v1/image/assets/TEMP/26ac303d3f7779196248b71946d5749bc5f65edf?placeholderIfAbsent=true',
    isActive: false
  }
];

const folderItems = [
  { id: 'view-all', label: 'View all', badge: '18' },
  { id: 'recent', label: 'Recent', badge: '8' },
  { id: 'favorites', label: 'Favorites', badge: '6' },
  { id: 'shared', label: 'Shared', badge: '4' }
];

const bottomItems: NavigationItem[] = [
  {
    id: 'reporting',
    label: 'Reporting',
    icon: 'https://api.builder.io/api/v1/image/assets/TEMP/7ba30372eb9ceeb5340fbddb9281962736f050d6?placeholderIfAbsent=true'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'https://api.builder.io/api/v1/image/assets/TEMP/ab82742d85ee83c88c9f57668d34e9fc4633d347?placeholderIfAbsent=true'
  },
  {
    id: 'support',
    label: 'Support',
    icon: 'https://api.builder.io/api/v1/image/assets/TEMP/b2cb9df4a7afe95e666e358285aab7d54f6698a4?placeholderIfAbsent=true'
  },
  {
    id: 'browser',
    label: 'Open in browser',
    icon: 'https://api.builder.io/api/v1/image/assets/TEMP/b6b35262ec7fb72bd00a0633651ef0efd190d2e5?placeholderIfAbsent=true',
    hasDropdown: true
  }
];

export const Sidebar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [foldersExpanded, setFoldersExpanded] = useState(true);

  const toggleFolders = () => {
    setFoldersExpanded(!foldersExpanded);
  };

  return (
    <aside className="items-stretch flex min-w-60 h-full w-[296px] bg-white pl-1 pr-0 py-1">
      <div className="border shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] min-w-60 w-full flex-1 shrink basis-[0%] bg-white rounded-xl border-solid border-[#E9EAEB]">
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
                    item.isActive ? 'bg-neutral-50' : 'bg-white hover:bg-gray-50'
                  }`}>
                    <div className="items-center flex w-full gap-2 flex-1 shrink basis-[0%] my-auto">
                      <div className="items-center flex w-[22px] my-auto pr-0.5">
                        <img
                          src={item.icon}
                          className="aspect-[1] object-contain w-5 self-stretch my-auto"
                          alt={item.label}
                        />
                      </div>
                      <div className={`text-base font-semibold leading-6 self-stretch my-auto ${
                        item.isActive ? 'text-[#252B37]' : 'text-[#414651]'
                      }`}>
                        {item.label}
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </section>

            <div className="items-stretch flex w-full flex-col justify-center px-5 py-2">
              <div className="border min-h-px w-full bg-[#E9EAEB] border-[rgba(233,234,235,1)] border-solid" />
            </div>

            <section className="w-full px-4 py-0">
              <div className="w-full">
                <div className="items-center flex w-full overflow-hidden px-0 py-0.5">
                  <button
                    onClick={toggleFolders}
                    className="items-center flex min-w-60 w-full gap-3 flex-1 shrink basis-[0%] bg-white my-auto px-3 py-2 rounded-md hover:bg-gray-50"
                  >
                    <div className="items-center flex gap-2 flex-1 shrink basis-[0%] my-auto">
                      <div className="items-center flex w-[22px] my-auto pr-0.5">
                        <img
                          src="https://api.builder.io/api/v1/image/assets/TEMP/42d3a583404ab2ea93b15c4e28db69c40de05615?placeholderIfAbsent=true"
                          className="aspect-[1] object-contain w-5 self-stretch my-auto"
                          alt="Folders"
                        />
                      </div>
                      <div className="text-[#414651] text-base font-semibold leading-6 self-stretch my-auto">
                        Folders
                      </div>
                    </div>
                    <img
                      src="https://api.builder.io/api/v1/image/assets/TEMP/5669200d114885f87a8ed8729fa55f82d63a0609?placeholderIfAbsent=true"
                      className={`aspect-[1] object-contain w-4 self-stretch shrink-0 my-auto transition-transform ${
                        foldersExpanded ? 'rotate-180' : ''
                      }`}
                      alt="Expand"
                    />
                  </button>
                </div>
                {foldersExpanded && (
                  <div className="w-full pb-1">
                    {folderItems.map((item) => (
                      <div key={item.id} className="items-center flex w-full overflow-hidden px-0 py-0.5">
                        <button className="items-center flex min-w-60 w-full gap-3 flex-1 shrink basis-[0%] bg-white my-auto pl-[42px] pr-3 py-2 rounded-md hover:bg-gray-50 max-md:pl-5">
                          <div className="items-center flex gap-2 text-base text-[#414651] font-semibold flex-1 shrink basis-4 my-auto">
                            <div className="text-[#414651] text-base leading-6 self-stretch my-auto">
                              {item.label}
                            </div>
                          </div>
                          <Badge>
                            <div className="text-[#414651] text-xs leading-[18px] self-stretch my-auto">
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
              <div className="border min-h-px w-full bg-[#E9EAEB] border-[rgba(233,234,235,1)] border-solid" />
            </div>

            <section className="w-full px-4 py-0">
              {bottomItems.map((item) => (
                <div key={item.id} className="items-center flex w-full overflow-hidden px-0 py-0.5">
                  <button className="items-center flex min-w-60 w-full gap-3 flex-1 shrink basis-[0%] bg-white my-auto px-3 py-2 rounded-md hover:bg-gray-50">
                    <div className={`items-center flex gap-2 flex-1 shrink ${
                      item.id === 'support' ? 'basis-3' : 'basis-[0%]'
                    } my-auto`}>
                      <div className="items-center flex w-[22px] my-auto pr-0.5">
                        <img
                          src={item.icon}
                          className="aspect-[1] object-contain w-5 self-stretch my-auto"
                          alt={item.label}
                        />
                      </div>
                      <div className="text-[#414651] text-base font-semibold leading-6 self-stretch my-auto">
                        {item.label}
                      </div>
                    </div>
                    {item.id === 'support' && (
                      <Badge variant="online">
                        <img
                          src="https://api.builder.io/api/v1/image/assets/TEMP/038d191f0b8398d0a9226b14a73bbc78049e4eb4?placeholderIfAbsent=true"
                          className="aspect-[1] object-contain w-2 self-stretch shrink-0 my-auto"
                          alt="Online"
                        />
                        <div className="text-[#414651] text-xs leading-[18px] self-stretch my-auto">
                          Online
                        </div>
                      </Badge>
                    )}
                    {item.hasDropdown && (
                      <img
                        src="https://api.builder.io/api/v1/image/assets/TEMP/80551d1a4b8977855b8aa58c9b51c08b18622f71?placeholderIfAbsent=true"
                        className="aspect-[1] object-contain w-4 self-stretch shrink-0 my-auto"
                        alt="Dropdown"
                      />
                    )}
                  </button>
                </div>
              ))}
            </section>
          </div>
        </nav>

        <footer className="w-full gap-4 mt-[181px] pt-0 pb-4 px-4 max-md:mt-10">
          <UserAccountCard />
        </footer>
      </div>
    </aside>
  );
};
