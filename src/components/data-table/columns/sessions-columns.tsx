/**
 * Sessions Table Columns
 * 
 * Column definitions for the user sessions data table.
 * Displays device info, IP address, last active time, and actions.
 * 
 * @module components/data-table/columns/sessions-columns
 */

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Monitor01, Phone01 } from '@untitledui/icons';
import { formatDistanceToNow } from 'date-fns';

export interface SessionData {
  id: string;
  created_at: string;
  updated_at: string;
  user_agent: string | null;
  ip: string | null;
  is_current: boolean;
  device: string;
  browser: string;
  os: string;
}

interface SessionColumnsProps {
  onRevoke: (sessionId: string) => void;
  isRevoking: string | null;
}

export const createSessionColumns = ({
  onRevoke,
  isRevoking,
}: SessionColumnsProps): ColumnDef<SessionData>[] => [
  {
    accessorKey: 'device',
    size: 280,
    minSize: 200,
    maxSize: 350,
    header: () => <span className="text-xs font-medium">Device</span>,
    cell: ({ row }) => {
      const session = row.original;
      const DeviceIcon = session.device.includes('Mobile') || session.device.includes('Tablet') ? Phone01 : Monitor01;
      
      return (
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2 bg-muted rounded-lg flex-shrink-0">
            <DeviceIcon size={16} className="text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{session.browser}</span>
              {session.is_current && (
                <Badge variant="outline" size="sm" className="bg-status-active/10 text-status-active border-status-active/20">
                  Current
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground truncate">
              {session.os} • {session.device}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'ip',
    size: 140,
    minSize: 100,
    maxSize: 180,
    header: () => <span className="text-xs font-medium">IP Address</span>,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground font-mono">
        {row.original.ip || 'Unknown'}
      </span>
    ),
  },
  {
    accessorKey: 'updated_at',
    size: 160,
    minSize: 120,
    maxSize: 200,
    header: () => <span className="text-xs font-medium">Last Active</span>,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.is_current 
          ? 'Now' 
          : formatDistanceToNow(new Date(row.original.updated_at), { addSuffix: true })}
      </span>
    ),
  },
  {
    id: 'actions',
    size: 100,
    minSize: 80,
    maxSize: 120,
    header: () => <span className="text-xs font-medium sr-only">Actions</span>,
    cell: ({ row }) => {
      const session = row.original;
      
      // Don't show revoke for current session
      if (session.is_current) return null;
      
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRevoke(session.id)}
          disabled={isRevoking === session.id}
          className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/50 hover:bg-destructive/10"
        >
          Remove
        </Button>
      );
    },
  },
];
