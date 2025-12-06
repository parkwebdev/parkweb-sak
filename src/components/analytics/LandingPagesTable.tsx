import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SearchMd, ArrowUp, ArrowDown } from '@untitledui/icons';

interface LandingPageData {
  url: string;
  visits: number;
  avgDuration: number;
  conversions: number;
  agentName?: string;
}

interface LandingPagesTableProps {
  data: LandingPageData[];
  loading?: boolean;
}

type SortField = 'url' | 'visits' | 'avgDuration' | 'conversions';
type SortDirection = 'asc' | 'desc';

const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
};

const formatUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    let path = parsed.pathname + parsed.search;
    if (path === '/') path = '/ (home)';
    return path.length > 50 ? path.substring(0, 47) + '...' : path;
  } catch {
    return url.length > 50 ? url.substring(0, 47) + '...' : url;
  }
};

export const LandingPagesTable: React.FC<LandingPagesTableProps> = ({ data, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('visits');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const filteredAndSortedData = useMemo(() => {
    let result = data.filter(item =>
      item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.agentName?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    result.sort((a, b) => {
      let aVal: number | string = a[sortField];
      let bVal: number | string = b[sortField];

      if (sortField === 'url') {
        aVal = formatUrl(a.url);
        bVal = formatUrl(b.url);
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc' 
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return result;
  }, [data, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Popular Landing Pages</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Loading...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Popular Landing Pages</CardTitle>
          <div className="relative w-64">
            <SearchMd className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAndSortedData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No landing page data available</span>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('url')}
                  >
                    <div className="flex items-center">
                      Page <SortIcon field="url" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('visits')}
                  >
                    <div className="flex items-center justify-end">
                      Visits <SortIcon field="visits" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('avgDuration')}
                  >
                    <div className="flex items-center justify-end">
                      Avg. Time <SortIcon field="avgDuration" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('conversions')}
                  >
                    <div className="flex items-center justify-end">
                      Leads <SortIcon field="conversions" />
                    </div>
                  </TableHead>
                  <TableHead>Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedData.slice(0, 20).map((page, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-xs max-w-[200px] truncate" title={page.url}>
                      {formatUrl(page.url)}
                    </TableCell>
                    <TableCell className="text-right">{page.visits}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDuration(page.avgDuration)}
                    </TableCell>
                    <TableCell className="text-right">{page.conversions}</TableCell>
                    <TableCell>
                      {page.agentName && (
                        <Badge variant="secondary" className="text-xs">
                          {page.agentName}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
