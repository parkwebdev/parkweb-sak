import React, { useState, useEffect } from 'react';
import { Settings, ChevronDown, ArrowUpDown, Eye, Edit, Check, User, Clock } from 'lucide-react';
import { SearchInput } from './SearchInput';
import { Badge } from './Badge';
import { ProgressBar } from './ProgressBar';

interface TableRow {
  id: string;
  companyName: string;
  clientName: string;
  businessType: string;
  submittedDate: string;
  status: 'Complete' | 'Incomplete' | 'In Review';
  percentage: number;
}

const tableData: TableRow[] = [
  { id: '1', companyName: 'Mountain View RV Park', clientName: 'Sarah Johnson', businessType: 'RV Park', submittedDate: '2024-01-15', status: 'Complete', percentage: 100 },
  { id: '2', companyName: 'Sunset Manufacturing', clientName: 'Michael Chen', businessType: 'Manufactured Home Community', submittedDate: '2024-01-12', status: 'Incomplete', percentage: 45 },
  { id: '3', companyName: 'Elite Capital Partners', clientName: 'Jessica Rodriguez', businessType: 'Capital & Syndication', submittedDate: '2024-01-10', status: 'In Review', percentage: 85 },
  { id: '4', companyName: 'Local Plumbing Pro', clientName: 'David Miller', businessType: 'Local Business', submittedDate: '2024-01-08', status: 'Complete', percentage: 100 },
  { id: '5', companyName: 'National Tech Solutions', clientName: 'Amanda Foster', businessType: 'National Business', submittedDate: '2024-01-05', status: 'Incomplete', percentage: 30 },
  { id: '6', companyName: 'Riverside Communities', clientName: 'Robert Thompson', businessType: 'Manufactured Home Community', submittedDate: '2024-01-03', status: 'In Review', percentage: 70 },
  { id: '7', companyName: 'Premier Investment Group', clientName: 'Lisa Anderson', businessType: 'Capital & Syndication', submittedDate: '2024-01-01', status: 'Complete', percentage: 100 },
];

interface DataTableProps {
  activeTab?: string;
}

export const DataTable: React.FC<DataTableProps> = ({ activeTab = 'onboarding' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState('view-all');
  const [currentActiveTab, setCurrentActiveTab] = useState(activeTab);

  // Update internal state when prop changes
  useEffect(() => {
    setCurrentActiveTab(activeTab);
  }, [activeTab]);

  const getFilteredDataByTab = () => {
    let data = tableData;
    
    if (currentActiveTab === 'onboarding') {
      data = data.filter(row => row.status === 'Incomplete' || row.status === 'In Review');
    } else if (currentActiveTab === 'scope-of-work') {
      data = data.filter(row => row.status === 'In Review');
    } else if (currentActiveTab === 'completed') {
      data = data.filter(row => row.status === 'Complete');
    }

    // Apply additional filters
    if (activeFilter !== 'view-all') {
      const filterStatus = activeFilter.replace('-', ' ').split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ') as 'Complete' | 'Incomplete' | 'In Review';
      
      data = data.filter(row => row.status === filterStatus);
    }

    return data;
  };

  const filteredData = getFilteredDataByTab().filter(row =>
    row.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.businessType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const searchResults = filteredData.map(item => ({
    id: item.id,
    title: item.companyName,
    description: `${item.businessType} • ${item.status}`,
    category: 'Companies'
  }));

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev =>
      prev.includes(id)
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    setSelectedRows(prev =>
      prev.length === filteredData.length ? [] : filteredData.map(row => row.id)
    );
  };

  return (
    <div className="border shadow-sm w-full overflow-hidden bg-card rounded-xl border-border">
      <header className="w-full gap-5 bg-background">
        <div className="flex w-full gap-4 flex-wrap pt-5 pb-0 px-6 max-md:px-5">
          <div className="justify-center items-stretch flex min-w-60 flex-col text-lg text-foreground font-semibold leading-loose flex-1 shrink basis-[0%] gap-0.5">
            <div className="items-center flex w-full gap-2">
              <h2 className="text-foreground text-lg font-semibold leading-7 tracking-tight self-stretch my-auto">
                {currentActiveTab === 'onboarding' ? 'Onboarding Forms' : 
                 currentActiveTab === 'scope-of-work' ? 'Scope of Work Documents' : 
                 'Completed Projects'}
              </h2>
            </div>
          </div>
          <button className="w-5 hover:bg-accent rounded">
            <Settings size={18} />
          </button>
        </div>
        <div className="bg-border flex min-h-px w-full mt-5" />
      </header>

      <div className="w-full">
        <div className="justify-between items-center flex w-full gap-4 flex-wrap px-6 py-3 rounded-xl max-md:px-5">
          <div className="border shadow-sm self-stretch flex overflow-hidden text-sm text-foreground font-semibold leading-none my-auto rounded-lg border-border max-md:flex-wrap">
            {['View all', 'Complete', 'Incomplete', 'In Review'].map((filter, index) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter.toLowerCase().replace(' ', '-'))}
                className={`justify-center items-center flex min-h-10 gap-2 px-3 py-2 max-md:px-2 max-md:text-xs ${
                  index === 0 ? 'bg-muted' : 'bg-background hover:bg-accent/50'
                } ${index < 3 ? 'border-r-border border-r border-solid' : ''}`}
              >
                <div className="text-foreground text-sm leading-5 self-stretch my-auto max-md:text-xs">
                  {filter}
                </div>
              </button>
            ))}
          </div>
          <div className="self-stretch flex items-center gap-3 whitespace-nowrap my-auto max-md:w-full max-md:flex-wrap">
            <SearchInput
              placeholder="Search"
              value={searchTerm}
              onChange={setSearchTerm}
              searchResults={searchResults}
              className="max-w-[296px] min-w-60 w-[296px] max-md:w-full max-md:min-w-0"
            />
            <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden text-sm text-foreground font-semibold leading-none bg-background px-3.5 py-2.5 rounded-lg border-border hover:bg-accent/50 max-md:px-2">
              <ChevronDown size={16} className="text-muted-foreground" />
              <div className="justify-center items-center self-stretch flex my-auto px-0.5 py-0 max-md:hidden">
                <div className="text-foreground text-sm leading-5 self-stretch my-auto">
                  Filters
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="border flex w-full bg-background border-border">
        <div className="flex-1">
          <div className="items-center flex min-h-11 w-full gap-3 bg-background px-4 py-3 border-b-border border-b border-solid">
            <button
              onClick={toggleAllSelection}
              className="self-stretch flex items-center justify-center w-5 my-auto"
            >
              <div className={`border self-stretch flex min-h-5 w-5 h-5 my-auto rounded-md border-solid border-border items-center justify-center ${
                selectedRows.length === filteredData.length ? 'bg-primary border-primary' : 'bg-background'
              }`}>
                {selectedRows.length === filteredData.length && (
                  <Check size={12} className="text-primary-foreground" />
                )}
              </div>
            </button>
            <div className="items-center self-stretch flex gap-1 text-xs text-muted-foreground font-semibold whitespace-nowrap my-auto">
              <div className="text-muted-foreground text-xs leading-[18px] self-stretch my-auto">
                Company Name
              </div>
              <ArrowUpDown size={12} />
            </div>
          </div>
          {filteredData.map((row) => (
            <div key={row.id} className="items-center flex min-h-[72px] w-full gap-3 px-4 py-4 border-b-border border-b border-solid">
              <button
                onClick={() => toggleRowSelection(row.id)}
                className="self-stretch flex items-center justify-center w-5 my-auto"
              >
                <div className={`border self-stretch flex min-h-5 w-5 h-5 my-auto rounded-md border-solid border-border items-center justify-center ${
                  selectedRows.includes(row.id) ? 'bg-primary border-primary' : 'bg-background'
                }`}>
                  {selectedRows.includes(row.id) && (
                    <Check size={12} className="text-primary-foreground" />
                  )}
                </div>
              </button>
              <div className="text-foreground text-sm font-medium leading-5 w-full">
                <div className="truncate font-medium">{row.companyName}</div>
                <div className="text-xs text-muted-foreground truncate mt-1">{row.clientName}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="w-48">
          <div className="items-center flex min-h-11 w-full gap-3 text-xs text-muted-foreground font-semibold bg-background px-4 py-3 border-b-border border-b border-solid">
            <div className="items-center self-stretch flex gap-1 my-auto">
              <div className="text-muted-foreground text-xs leading-[18px] self-stretch my-auto">
                Business Type
              </div>
              <ArrowUpDown size={12} />
            </div>
          </div>
          {filteredData.map((row) => (
            <div key={row.id} className="items-center flex min-h-[72px] w-full px-4 py-4 border-b-border border-b border-solid">
              <div className="text-muted-foreground text-sm leading-5 w-full truncate">
                {row.businessType}
              </div>
            </div>
          ))}
        </div>

        <div className="w-28">
          <div className="items-center flex min-h-11 w-full gap-3 text-xs text-muted-foreground font-semibold bg-background px-4 py-3 border-b-border border-b border-solid">
            <div className="items-center self-stretch flex gap-1 my-auto">
              <div className="text-muted-foreground text-xs leading-[18px] self-stretch my-auto">
                Submitted
              </div>
              <ArrowUpDown size={12} />
            </div>
          </div>
          {filteredData.map((row) => (
            <div key={row.id} className="items-center flex min-h-[72px] w-full px-4 py-4 border-b-border border-b border-solid">
              <div className="text-muted-foreground text-sm leading-5 w-full">
                {new Date(row.submittedDate).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1">
          <div className="items-center flex min-h-11 w-full gap-3 text-xs text-muted-foreground font-semibold bg-background px-4 py-3 border-b-border border-b border-solid">
            <div className="items-center self-stretch flex gap-1 my-auto">
              <div className="text-muted-foreground text-xs leading-[18px] self-stretch my-auto">
                Completion
              </div>
              <ArrowUpDown size={12} />
            </div>
          </div>
          {filteredData.map((row) => (
            <div key={row.id} className="items-stretch flex min-h-[72px] w-full px-4 py-4 border-b-border border-b border-solid">
              <div className="w-full">
                <ProgressBar percentage={row.percentage} />
              </div>
            </div>
          ))}
        </div>

        <div className="w-32">
          <div className="items-center flex min-h-11 w-full gap-3 text-muted-foreground font-semibold bg-background px-4 py-3 border-b-border border-b border-solid">
            <div className="items-center self-stretch flex gap-1 my-auto">
              <div className="text-muted-foreground text-xs leading-[18px] self-stretch my-auto">
                Status
              </div>
              <ArrowUpDown size={12} />
            </div>
          </div>
          {filteredData.map((row) => (
            <div key={row.id} className="items-center flex min-h-[72px] w-full px-3 py-4 border-b-border border-b border-solid">
              <Badge 
                variant={row.status === 'Complete' ? 'default' : row.status === 'In Review' ? 'online' : 'folder'}
                className="w-full justify-center text-xs px-2"
              >
                {row.status === 'Complete' && <Check size={10} className="mr-1" />}
                {row.status === 'In Review' && <Clock size={10} className="mr-1" />}
                {row.status === 'Incomplete' && <User size={10} className="mr-1" />}
                <span className="truncate text-xs">
                  {row.status}
                </span>
              </Badge>
            </div>
          ))}
        </div>

        <div className="w-20">
          <div className="flex min-h-11 w-full gap-3 bg-background px-3 py-3 border-b-border border-b border-solid" />
          {filteredData.map((row) => (
            <div key={row.id} className="items-center flex min-h-[72px] w-full gap-1 px-2 py-4 border-b-border border-b border-solid">
              <button className="justify-center items-center flex overflow-hidden w-6 h-6 p-1 rounded-md hover:bg-accent">
                <Eye size={12} />
              </button>
              <button className="justify-center items-center flex overflow-hidden w-6 h-6 p-1 rounded-md hover:bg-accent">
                <Edit size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
      </div>

      <footer className="justify-center items-center flex w-full gap-3 text-sm leading-none flex-wrap pt-3 pb-4 px-6">
        <div className="text-foreground text-sm font-medium leading-5 self-stretch my-auto">
          Page 1 of 10
        </div>
        <div className="items-center self-stretch flex gap-3 text-foreground font-semibold whitespace-nowrap flex-wrap flex-1 justify-end my-auto">
          <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden bg-background px-3 py-2 rounded-lg border-border hover:bg-accent/50">
            <div className="justify-center items-center self-stretch flex my-auto px-0.5 py-0">
              <div className="text-foreground text-sm leading-5 self-stretch my-auto">
                Previous
              </div>
            </div>
          </button>
          <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden bg-background px-3 py-2 rounded-lg border-border hover:bg-accent/50">
            <div className="justify-center items-center self-stretch flex my-auto px-0.5 py-0">
              <div className="text-foreground text-sm leading-5 self-stretch my-auto">
                Next
              </div>
            </div>
          </button>
        </div>
      </footer>
    </div>
  );
};