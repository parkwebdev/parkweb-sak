import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { File06, Link03, Database01, Trash01, RefreshCcw01, CheckCircle, XCircle, Clock } from '@untitledui/icons';
import { formatDistanceToNow } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

interface KnowledgeSourceCardProps {
  source: Tables<'knowledge_sources'>;
  onDelete: (id: string) => void;
  onReprocess: (id: string) => void;
}

const typeIcons = {
  pdf: File06,
  url: Link03,
  api: Database01,
  json: Database01,
  xml: Database01,
  csv: Database01,
};

const statusColors = {
  processing: 'secondary',
  ready: 'default',
  error: 'destructive',
} as const;

const statusIcons = {
  processing: Clock,
  ready: CheckCircle,
  error: XCircle,
};

export const KnowledgeSourceCard: React.FC<KnowledgeSourceCardProps> = ({
  source,
  onDelete,
  onReprocess,
}) => {
  const Icon = typeIcons[source.type as keyof typeof typeIcons] || Database01;
  const StatusIcon = statusIcons[source.status as keyof typeof statusIcons] || Clock;
  const metadata = source.metadata as Record<string, any> || {};

  const getDisplayName = () => {
    if (metadata.filename) return metadata.filename;
    if (source.type === 'url') return new URL(source.source).hostname;
    if (metadata.name) return metadata.name;
    return `${source.type.toUpperCase()} Source`;
  };

  const getContentPreview = () => {
    if (source.content) {
      return source.content.substring(0, 150) + (source.content.length > 150 ? '...' : '');
    }
    if (source.type === 'url') {
      return source.source;
    }
    return 'No content preview available';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-accent">
              <Icon className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{getDisplayName()}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{source.type.toUpperCase()}</Badge>
                <Badge variant={statusColors[source.status as keyof typeof statusColors] || 'secondary'}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {source.status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onReprocess(source.id)}
              disabled={source.status === 'processing'}
            >
              <RefreshCcw01 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(source.id)}
            >
              <Trash01 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-muted-foreground">Preview:</span>
            <p className="text-xs mt-1 text-muted-foreground">{getContentPreview()}</p>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Added {formatDistanceToNow(new Date(source.created_at), { addSuffix: true })}</span>
            {metadata.size && (
              <span>{(metadata.size / 1024).toFixed(2)} KB</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
