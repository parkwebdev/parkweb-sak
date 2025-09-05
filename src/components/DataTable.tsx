import React, { useState } from 'react';
import { SearchInput } from './SearchInput';
import { Badge } from './Badge';
import { ProgressBar } from './ProgressBar';

interface TableRow {
  id: string;
  page: string;
  sessions: string;
  avgTime: string;
  percentage: number;
  folder: string;
}

const tableData: TableRow[] = [
  { id: '1', page: 'sodium.app', sessions: '4,288', avgTime: '1m 24s', percentage: 62.4, folder: 'General' },
  { id: '2', page: 'sodium.app/free-icons', sessions: '582', avgTime: '1m 8s', percentage: 8.2, folder: 'General' },
  { id: '3', page: 'sodium.app/icons', sessions: '464', avgTime: '1m 12s', percentage: 7.6, folder: 'General' },
  { id: '4', page: 'sodium.app/components', sessions: '446', avgTime: '2m 22s', percentage: 7.2, folder: 'General' },
  { id: '5', page: 'sodium.app/pricing', sessions: '382', avgTime: '48s', percentage: 7.0, folder: 'General' },
  { id: '6', page: 'sodium.app/faqs', sessions: '326', avgTime: '56s', percentage: 6.4, folder: 'General' },
  { id: '7', page: 'sodium.app/blog', sessions: '262', avgTime: '1m 14s', percentage: 5.4, folder: 'General' },
];

export const DataTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState('view-all');

  const filteredData = tableData.filter(row =>
    row.page.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="border shadow-[0_1px_2px_0_rgba(10,13,18,0.05)] w-full overflow-hidden bg-[#FDFDFD] rounded-xl border-solid border-[#E9EAEB] max-md:max-w-full">
      <header className="w-full gap-5 bg-white max-md:max-w-full">
        <div className="flex w-full gap-4 flex-wrap pt-5 pb-0 px-6 max-md:max-w-full max-md:px-5">
          <div className="justify-center items-stretch flex min-w-60 flex-col text-lg text-[#181D27] font-semibold leading-loose flex-1 shrink basis-[0%] gap-0.5 max-md:max-w-full">
            <div className="items-center flex w-full gap-2 max-md:max-w-full">
              <h2 className="text-[#181D27] text-lg leading-7 self-stretch my-auto">
                Pages and screens
              </h2>
            </div>
          </div>
          <button className="w-5 hover:bg-gray-50 rounded">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/cb7ec2a8b0f5f1d646a1dcae17324af02438abd3?placeholderIfAbsent=true"
              className="aspect-[1] object-contain w-5"
              alt="Options"
            />
          </button>
        </div>
        <div className="bg-[rgba(233,234,235,1)] flex min-h-px w-full fill-[#E9EAEB] mt-5 max-md:max-w-full" />
      </header>

      <div className="w-full max-md:max-w-full">
        <div className="justify-between items-center flex w-full gap-[40px_100px] flex-wrap px-6 py-3 rounded-xl max-md:max-w-full max-md:px-5">
          <div className="border shadow-[0_0_0_1px_rgba(10,13,18,0.18)_inset,0_-2px_0_0_rgba(10,13,18,0.05)_inset,0_1px_2px_0_rgba(10,13,18,0.05)] self-stretch flex overflow-hidden text-sm text-[#414651] font-semibold leading-none my-auto rounded-lg border-solid border-[#D5D7DA]">
            {['View all', 'Public', 'Private'].map((filter, index) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter.toLowerCase().replace(' ', '-'))}
                className={`justify-center items-center flex min-h-10 gap-2 px-4 py-2 ${
                  index === 0 ? 'bg-neutral-50' : 'bg-white hover:bg-gray-50'
                } ${index < 2 ? 'border-r-[#D5D7DA] border-r border-solid' : ''}`}
              >
                <div className="text-[#414651] text-sm leading-5 self-stretch my-auto">
                  {filter}
                </div>
              </button>
            ))}
          </div>
          <div className="self-stretch flex min-w-60 items-center gap-3 whitespace-nowrap my-auto">
            <SearchInput
              placeholder="Search"
              value={searchTerm}
              onChange={setSearchTerm}
              className="max-w-[296px] min-w-60 w-[296px]"
            />
            <button className="justify-center items-center border shadow-[0_0_0_1px_rgba(10,13,18,0.18)_inset,0_-2px_0_0_rgba(10,13,18,0.05)_inset,0_1px_2px_0_rgba(10,13,18,0.05)] flex gap-1 overflow-hidden text-sm text-[#414651] font-semibold leading-none bg-white px-3.5 py-2.5 rounded-lg border-solid border-[#D5D7DA] hover:bg-gray-50">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/82e89105a3d371b6432021f96dd2f7188330ff32?placeholderIfAbsent=true"
                className="aspect-[1] object-contain w-5 self-stretch shrink-0 my-auto"
                alt="Filter"
              />
              <div className="justify-center items-center self-stretch flex my-auto px-0.5 py-0">
                <div className="text-[#414651] text-sm leading-5 self-stretch my-auto">
                  Filters
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="border flex w-full overflow-hidden flex-wrap bg-white border-solid border-[#E9EAEB] max-md:max-w-full">
        <div className="min-w-60 flex-1 shrink basis-[0%]">
          <div className="items-center flex min-h-11 w-full gap-3 bg-white px-6 py-3 border-b-[#E9EAEB] border-b border-solid max-md:px-5">
            <button
              onClick={toggleAllSelection}
              className="self-stretch flex items-center justify-center w-5 my-auto"
            >
              <div className={`border self-stretch flex min-h-5 w-5 h-5 my-auto rounded-md border-solid border-[#D5D7DA] ${
                selectedRows.length === filteredData.length ? 'bg-blue-500' : ''
              }`} />
            </button>
            <div className="items-center self-stretch flex gap-1 text-xs text-[#717680] font-semibold whitespace-nowrap my-auto">
              <div className="text-[#717680] text-xs leading-[18px] self-stretch my-auto">
                Page
              </div>
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/10afe8e330e42793fa5efb66977d0a5856129c18?placeholderIfAbsent=true"
                className="aspect-[1] object-contain w-3 self-stretch shrink-0 my-auto"
                alt="Sort"
              />
            </div>
          </div>
          {filteredData.map((row) => (
            <div key={row.id} className="items-center flex min-h-[72px] w-full gap-3 px-6 py-4 border-b-[#E9EAEB] border-b border-solid max-md:px-5">
              <button
                onClick={() => toggleRowSelection(row.id)}
                className="self-stretch flex items-center justify-center w-5 my-auto"
              >
                <div className={`border self-stretch flex min-h-5 w-5 h-5 my-auto rounded-md border-solid border-[#D5D7DA] ${
                  selectedRows.includes(row.id) ? 'bg-blue-500' : ''
                }`} />
              </button>
              <div className="text-[#181D27] text-sm font-medium leading-5 self-stretch my-auto">
                {row.page}
              </div>
            </div>
          ))}
        </div>

        <div className="text-sm text-[#535862] font-normal whitespace-nowrap w-[117px]">
          <div className="items-center flex min-h-11 w-full gap-3 text-xs text-[#717680] font-semibold bg-white px-6 py-3 border-b-[#E9EAEB] border-b border-solid max-md:px-5">
            <div className="items-center self-stretch flex gap-1 my-auto">
              <div className="text-[#717680] text-xs leading-[18px] self-stretch my-auto">
                Sessions
              </div>
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/385a4a231b818109c63647032f4c9129d46a88ee?placeholderIfAbsent=true"
                className="aspect-[1] object-contain w-3 self-stretch shrink-0 my-auto"
                alt="Sort"
              />
            </div>
          </div>
          {filteredData.map((row) => (
            <div key={row.id} className="items-center flex min-h-[72px] w-full leading-none px-6 py-4 border-b-[#E9EAEB] border-b border-solid max-md:px-5">
              <div className="text-[#535862] text-sm leading-5 self-stretch my-auto">
                {row.sessions}
              </div>
            </div>
          ))}
        </div>

        <div className="text-sm text-[#535862] font-normal w-[115px]">
          <div className="items-center flex min-h-11 w-full gap-3 text-xs text-[#717680] font-semibold bg-white px-6 py-3 border-b-[#E9EAEB] border-b border-solid max-md:px-5">
            <div className="items-center self-stretch flex gap-1 my-auto">
              <div className="text-[#717680] text-xs leading-[18px] self-stretch my-auto">
                Avg time
              </div>
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/385a4a231b818109c63647032f4c9129d46a88ee?placeholderIfAbsent=true"
                className="aspect-[1] object-contain w-3 self-stretch shrink-0 my-auto"
                alt="Sort"
              />
            </div>
          </div>
          {filteredData.map((row) => (
            <div key={row.id} className="items-center flex min-h-[72px] w-full leading-none px-6 py-4 border-b-[#E9EAEB] border-b border-solid max-md:px-5">
              <div className="text-[#535862] text-sm leading-5 self-stretch my-auto">
                {row.avgTime}
              </div>
            </div>
          ))}
        </div>

        <div className="min-w-60 flex-1 shrink basis-[0%]">
          <div className="items-center flex min-h-11 w-full gap-3 text-xs text-[#717680] font-semibold bg-white px-6 py-3 border-b-[#E9EAEB] border-b border-solid max-md:px-5">
            <div className="items-center self-stretch flex gap-1 my-auto">
              <div className="text-[#717680] text-xs leading-[18px] self-stretch my-auto">
                % of total
              </div>
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/385a4a231b818109c63647032f4c9129d46a88ee?placeholderIfAbsent=true"
                className="aspect-[1] object-contain w-3 self-stretch shrink-0 my-auto"
                alt="Sort"
              />
            </div>
          </div>
          {filteredData.map((row) => (
            <div key={row.id} className="items-stretch flex min-h-[72px] w-full gap-3 px-6 py-4 border-b-[#E9EAEB] border-b border-solid max-md:px-5">
              <ProgressBar percentage={row.percentage} />
            </div>
          ))}
        </div>

        <div className="text-xs text-[#414651] font-medium whitespace-nowrap w-[117px]">
          <div className="items-center flex min-h-11 w-full gap-3 text-[#717680] font-semibold bg-white px-6 py-3 border-b-[#E9EAEB] border-b border-solid max-md:px-5">
            <div className="items-center self-stretch flex gap-1 my-auto">
              <div className="text-[#717680] text-xs leading-[18px] self-stretch my-auto">
                Folder
              </div>
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/10afe8e330e42793fa5efb66977d0a5856129c18?placeholderIfAbsent=true"
                className="aspect-[1] object-contain w-3 self-stretch shrink-0 my-auto"
                alt="Sort"
              />
            </div>
          </div>
          {filteredData.map((row) => (
            <div key={row.id} className="items-center flex min-h-[72px] w-full text-center px-6 py-4 border-b-[#E9EAEB] border-b border-solid max-md:px-5">
              <Badge variant="folder">
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/f1828c9f4e83c8803a5f7ec69811ecde4deb444c?placeholderIfAbsent=true"
                  className="aspect-[1] object-contain w-2 self-stretch shrink-0 my-auto"
                  alt="Folder"
                />
                <div className="text-[#414651] text-xs leading-[18px] self-stretch my-auto">
                  {row.folder}
                </div>
              </Badge>
            </div>
          ))}
        </div>

        <div className="w-[98px]">
          <div className="flex min-h-11 w-full gap-3 bg-white px-6 py-3 border-b-[#E9EAEB] border-b border-solid" />
          {filteredData.map((row) => (
            <div key={row.id} className="items-center flex min-h-[72px] w-full gap-0.5 p-4 border-b-[#E9EAEB] border-b border-solid">
              <button className="justify-center items-center flex overflow-hidden w-8 p-2 rounded-md hover:bg-gray-50">
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/36a376170e8851847ae8a4c9ace1e12d98f98228?placeholderIfAbsent=true"
                  className="aspect-[1] object-contain w-4 self-stretch my-auto"
                  alt="View"
                />
              </button>
              <button className="justify-center items-center flex overflow-hidden w-8 p-2 rounded-md hover:bg-gray-50">
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/52cc3cc998717caf87e5220c9807f1f975ecab06?placeholderIfAbsent=true"
                  className="aspect-[1] object-contain w-4 self-stretch my-auto"
                  alt="Edit"
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <footer className="justify-center items-center flex w-full gap-3 text-sm leading-none flex-wrap pt-3 pb-4 px-6 max-md:max-w-full max-md:px-5">
        <div className="text-[#414651] text-sm font-medium leading-5 self-stretch my-auto">
          Page 1 of 10
        </div>
        <div className="items-center self-stretch flex min-w-60 gap-3 text-[#414651] font-semibold whitespace-nowrap flex-wrap flex-1 shrink basis-[0%] my-auto max-md:max-w-full">
          <button className="justify-center items-center border shadow-[0_0_0_1px_rgba(10,13,18,0.18)_inset,0_-2px_0_0_rgba(10,13,18,0.05)_inset,0_1px_2px_0_rgba(10,13,18,0.05)] flex gap-1 overflow-hidden bg-white px-3 py-2 rounded-lg border-solid border-[#D5D7DA] hover:bg-gray-50">
            <div className="justify-center items-center self-stretch flex my-auto px-0.5 py-0">
              <div className="text-[#414651] text-sm leading-5 self-stretch my-auto">
                Previous
              </div>
            </div>
          </button>
          <button className="justify-center items-center border shadow-[0_0_0_1px_rgba(10,13,18,0.18)_inset,0_-2px_0_0_rgba(10,13,18,0.05)_inset,0_1px_2px_0_rgba(10,13,18,0.05)] flex gap-1 overflow-hidden bg-white px-3 py-2 rounded-lg border-solid border-[#D5D7DA] hover:bg-gray-50">
            <div className="justify-center items-center self-stretch flex my-auto px-0.5 py-0">
              <div className="text-[#414651] text-sm leading-5 self-stretch my-auto">
                Next
              </div>
            </div>
          </button>
        </div>
      </footer>
    </div>
  );
};
