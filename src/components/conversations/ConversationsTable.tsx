import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye } from '@untitledui/icons';
import { formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Conversation = Tables<'conversations'> & {
  agents?: { name: string };
};

interface ConversationsTableProps {
  conversations: Conversation[];
  onView: (conversation: Conversation) => void;
}

export const ConversationsTable = ({ conversations, onView }: ConversationsTableProps) => {
  const statusColors = {
    active: 'bg-success/10 text-success border-success/20',
    human_takeover: 'bg-warning/10 text-warning border-warning/20',
    closed: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Last Update</TableHead>
            <TableHead>Lead</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conversations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No conversations found
              </TableCell>
            </TableRow>
          ) : (
            conversations.map((conversation) => {
              const metadata = conversation.metadata as any;
              return (
                <TableRow key={conversation.id}>
                  <TableCell className="font-medium">
                    {conversation.agents?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[conversation.status]}>
                      {conversation.status === 'human_takeover' ? 'Human' : conversation.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    {metadata?.lead_name || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(conversation)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
