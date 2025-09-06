import React, { useState, useEffect } from 'react';
import { Settings, ChevronDown, ArrowUpDown, Eye, Send, Check, User, Clock } from 'lucide-react';
import { SearchInput } from './SearchInput';
import { Badge } from './Badge';
import { ProgressBar } from './ProgressBar';
import { getBadgeVariant } from '@/lib/status-helpers';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [activeFilter, setActiveFilter] = useState<string>('view-all');
  const [currentActiveTab, setCurrentActiveTab] = useState(activeTab);

  useEffect(() => {
    setCurrentActiveTab(activeTab);
  }, [activeTab]);

  const getFilteredDataByTab = () => {
    let filtered = [...tableData];
    
    if (currentActiveTab === 'completed') {
      filtered = filtered.filter(item => item.status === 'Complete');
    } else if (currentActiveTab === 'scope-of-work') {
      filtered = filtered.filter(item => item.percentage >= 80);
    }

    if (activeFilter !== 'view-all') {
      if (activeFilter === 'complete') {
        filtered = filtered.filter(item => item.status === 'Complete');
      } else if (activeFilter === 'incomplete') {
        filtered = filtered.filter(item => item.status === 'Incomplete');
      } else if (activeFilter === 'in-review') {
        filtered = filtered.filter(item => item.status === 'In Review');
      }
    }

    return filtered;
  };

  const filteredData = getFilteredDataByTab().filter(row =>
    row.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.businessType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const searchResults = filteredData.map(row => ({
    title: row.companyName,
    subtitle: row.clientName,
    id: row.id
  }));

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    setSelectedRows(
      selectedRows.length === filteredData.length 
        ? [] 
        : filteredData.map(row => row.id)
    );
  };

  return (
    <div className="w-full bg-card border border-border rounded-xl overflow-hidden">
      <header className="w-full">
        <div className="items-center flex w-full gap-4 bg-background px-4 py-4">
          <div className="text-foreground text-base font-semibold leading-6 flex-1">
            <div className="items-center flex gap-2">
              <div className="border shadow-sm justify-center items-center flex gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg border-border">
                <User size={14} />
                <div className="text-xs font-medium">{filteredData.length}</div>
              </div>
              <h2 className="text-base font-semibold">
                {currentActiveTab === 'onboarding' ? 'Client Onboarding Forms' :
                 currentActiveTab === 'scope-of-work' ? 'Scope of Work Projects' :
                 'Completed Projects'}
              </h2>
            </div>
          </div>
          <button className="w-4 hover:bg-accent rounded p-0.5">
            <Settings size={14} />
          </button>
        </div>
        <div className="bg-border flex min-h-px w-full" />
      </header>

      <div className="w-full">
        <div className="justify-between items-center flex w-full gap-3 flex-wrap px-4 py-2.5 rounded-lg max-md:px-3">
          <div className="border shadow-sm self-stretch flex overflow-hidden text-xs text-foreground font-medium leading-none my-auto rounded-md border-border max-md:flex-wrap">
            {['View all', 'Complete', 'Incomplete', 'In Review'].map((filter, index) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter.toLowerCase().replace(' ', '-'))}
                className={`justify-center items-center flex min-h-8 gap-1.5 px-2.5 py-1.5 max-md:px-2 max-md:text-xs ${
                  index === 0 ? 'bg-muted' : 'bg-background hover:bg-accent/50'
                } ${index < 3 ? 'border-r-border border-r border-solid' : ''}`}
              >
                <div className="text-foreground text-xs leading-4 self-stretch my-auto max-md:text-xs">
                  {filter}
                </div>
              </button>
            ))}
          </div>
          <div className="self-stretch flex items-center gap-2.5 whitespace-nowrap my-auto max-md:w-full max-md:flex-wrap">
            <SearchInput
              placeholder="Search"
              value={searchTerm}
              onChange={setSearchTerm}
              searchResults={searchResults}
              className="max-w-[240px] min-w-48 w-[240px] max-md:w-full max-md:min-w-0"
            />
            <button className="justify-center items-center border shadow-sm flex gap-1 overflow-hidden text-xs text-foreground font-medium leading-none bg-background px-2.5 py-2 rounded-md border-border hover:bg-accent/50 max-md:px-2">
              <ChevronDown size={12} className="text-muted-foreground" />
              <div className="justify-center items-center self-stretch flex my-auto px-0.5 py-0 max-md:hidden">
                <div className="text-foreground text-xs leading-4 self-stretch my-auto">
                  Filters
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <button
                  onClick={toggleAllSelection}
                  className="flex items-center justify-center w-5"
                >
                  <div className={`border flex min-h-5 w-5 h-5 rounded-md border-solid border-border items-center justify-center ${
                    selectedRows.length === filteredData.length ? 'bg-primary border-primary' : 'bg-background'
                  }`}>
                    {selectedRows.length === filteredData.length && (
                      <Check size={12} className="text-primary-foreground" />
                    )}
                  </div>
                </button>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <span>Company Name</span>
                  <ArrowUpDown size={12} />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <span>Business Type</span>
                  <ArrowUpDown size={12} />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <span>Submitted</span>
                  <ArrowUpDown size={12} />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <span>Completion</span>
                  <ArrowUpDown size={12} />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  <ArrowUpDown size={12} />
                </div>
              </TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <button
                    onClick={() => toggleRowSelection(row.id)}
                    className="flex items-center justify-center w-5"
                  >
                    <div className={`border flex min-h-5 w-5 h-5 rounded-md border-solid border-border items-center justify-center ${
                      selectedRows.includes(row.id) ? 'bg-primary border-primary' : 'bg-background'
                    }`}>
                      {selectedRows.includes(row.id) && (
                        <Check size={12} className="text-primary-foreground" />
                      )}
                    </div>
                  </button>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{row.companyName}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <a 
                        href={`mailto:${row.clientName.toLowerCase().replace(' ', '')}@example.com`}
                        className="hover:underline"
                      >
                        {row.clientName}
                      </a>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.businessType}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(row.submittedDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <ProgressBar percentage={row.percentage} />
                </TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(row.status)}>
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-accent rounded">
                      <Eye size={14} />
                    </button>
                    <button className="p-1 hover:bg-accent rounded">
                      <Send size={14} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <footer className="bg-muted/30 w-full">
        <div className="justify-between items-center flex w-full gap-5 px-4 py-3 max-md:flex-wrap max-md:px-3">
          <div className="text-muted-foreground text-sm leading-5">
            Page 1 of 10
          </div>
          <div className="items-center flex gap-1">
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
        </div>
      </footer>
    </div>
  );
};