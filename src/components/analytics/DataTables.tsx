import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download01 } from '@untitledui/icons';
import { AnimatedTableRow } from '@/components/ui/animated-table-row';

interface DataTablesProps {
  activeTab: 'conversations' | 'leads' | 'agents' | 'usage';
  data: any;
}

export const DataTables = ({ activeTab, data }: DataTablesProps) => {
  const exportTableData = () => {
    // Simple CSV export for table data
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map((row: any) => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_data_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="capitalize">{activeTab} Data</CardTitle>
            <CardDescription>Detailed {activeTab} records</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportTableData}>
            <Download01 className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === 'conversations' && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.conversations?.map((conv: any, index: number) => (
                <AnimatedTableRow key={index} index={index}>
                  <TableCell>{format(new Date(conv.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                  <TableCell>{conv.agent_name || 'Unknown'}</TableCell>
                  <TableCell>
                    <Badge variant={conv.status === 'active' ? 'default' : 'secondary'}>
                      {conv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{conv.message_count || 0}</TableCell>
                  <TableCell>{conv.duration || '-'}</TableCell>
                </AnimatedTableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {activeTab === 'leads' && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.leads?.map((lead: any, index: number) => (
                <AnimatedTableRow key={index} index={index}>
                  <TableCell>{format(new Date(lead.created_at), 'MMM d, yyyy HH:mm')}</TableCell>
                  <TableCell>{lead.name || '-'}</TableCell>
                  <TableCell>{lead.email || '-'}</TableCell>
                  <TableCell>{lead.company || '-'}</TableCell>
                  <TableCell>
                    <Badge>{lead.status}</Badge>
                  </TableCell>
                </AnimatedTableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {activeTab === 'agents' && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Conversations</TableHead>
                <TableHead>Avg Response Time</TableHead>
                <TableHead>Satisfaction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.agentPerformance?.map((agent: any, index: number) => (
                <AnimatedTableRow key={index} index={index}>
                  <TableCell>{agent.agent_name}</TableCell>
                  <TableCell>{agent.total_conversations}</TableCell>
                  <TableCell>{agent.avg_response_time}s</TableCell>
                  <TableCell>{agent.satisfaction_score?.toFixed(1) || '-'}</TableCell>
                </AnimatedTableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {activeTab === 'usage' && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Conversations</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>API Calls</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.usageMetrics?.map((usage: any, index: number) => (
                <AnimatedTableRow key={index} index={index}>
                  <TableCell>{usage.date}</TableCell>
                  <TableCell>{usage.conversations}</TableCell>
                  <TableCell>{usage.messages}</TableCell>
                  <TableCell>{usage.api_calls}</TableCell>
                </AnimatedTableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {(!data[activeTab] || data[activeTab]?.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            No data available for the selected period
          </div>
        )}
      </CardContent>
    </Card>
  );
};
