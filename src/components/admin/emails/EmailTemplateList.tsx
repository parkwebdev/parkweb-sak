/**
 * Email Management Components
 * 
 * Components for managing email templates and delivery logs.
 * 
 * @module components/admin/emails/EmailTemplateList
 */

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import { DataTable } from '@/components/data-table/DataTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/admin/shared/StatusBadge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Eye, 
  Edit02, 
  Send01, 
  Mail01, 
  Check, 
  AlertCircle, 
  Clock 
} from '@untitledui/icons';
import { formatDistanceToNow } from 'date-fns';
import { formatCompactNumber } from '@/lib/admin/admin-utils';
import type { EmailTemplate, EmailDeliveryLog, EmailDeliveryStats as EmailStats } from '@/types/admin';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface EmailTemplateListProps {
  templates: EmailTemplate[];
  loading: boolean;
  onPreview: (template: EmailTemplate) => void;
  onEdit: (template: EmailTemplate) => void;
}

const templateColumnHelper = createColumnHelper<EmailTemplate>();

/**
 * Email template list component.
 */
export function EmailTemplateList({
  templates,
  loading,
  onPreview,
  onEdit,
}: EmailTemplateListProps) {
  const columns = useMemo<ColumnDef<EmailTemplate, unknown>[]>(
    () => [
      templateColumnHelper.accessor('name', {
        header: 'Template',
        cell: ({ getValue }) => (
          <span className="font-medium text-sm">{getValue()}</span>
        ),
      }),
      templateColumnHelper.accessor('subject', {
        header: 'Subject',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue()}</span>
        ),
      }),
      templateColumnHelper.accessor('active', {
        header: 'Status',
        cell: ({ getValue }) => (
          <Badge variant={getValue() ? 'default' : 'secondary'}>
            {getValue() ? 'Active' : 'Inactive'}
          </Badge>
        ),
      }),
      templateColumnHelper.accessor('updated_at', {
        header: 'Updated',
        cell: ({ getValue }) => (
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(getValue()), { addSuffix: true })}
          </span>
        ),
      }),
      templateColumnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPreview(row.original)}
            >
              <Eye size={14} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(row.original)}
            >
              <Edit02 size={14} aria-hidden="true" />
            </Button>
          </div>
        ),
      }),
    ],
    [onPreview, onEdit]
  );

  const table = useReactTable({
    data: templates,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <DataTable
      table={table}
      columns={columns}
      isLoading={loading}
      emptyMessage="No email templates found"
    />
  );
}

/**
 * Email template editor component.
 */
export function EmailTemplateEditor({
  template,
  onSave,
  onClose,
  isSaving,
}: {
  template: EmailTemplate | null;
  onSave: (template: Partial<EmailTemplate>) => Promise<void>;
  onClose: () => void;
  isSaving?: boolean;
}) {
  const [formData, setFormData] = useState<Partial<EmailTemplate>>(
    template || {
      name: '',
      subject: '',
      html_content: '',
      text_content: '',
      active: true,
    }
  );

  const handleSave = async () => {
    await onSave(formData);
    onClose();
  };

  return (
    <Sheet open={!!template} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Template</SheetTitle>
          <SheetDescription>Update email template content</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Name</Label>
            <Input
              id="template-name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-subject">Subject</Label>
            <Input
              id="template-subject"
              value={formData.subject || ''}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-html">HTML Content</Label>
            <Textarea
              id="template-html"
              value={formData.html_content || ''}
              onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
              className="min-h-[200px] font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-text">Text Content</Label>
            <Textarea
              id="template-text"
              value={formData.text_content || ''}
              onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Announcement builder component.
 */
export function AnnouncementBuilder({
  onSend,
  isSending,
}: {
  onSend: (announcement: { title: string; content: string; targetAudience: string }) => Promise<void>;
  isSending?: boolean;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');

  const handleSend = async () => {
    await onSend({ title, content, targetAudience });
    setTitle('');
    setContent('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Feature Announcement</CardTitle>
        <CardDescription>Send an announcement to users</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="announcement-title">Title</Label>
          <Input
            id="announcement-title"
            placeholder="New Feature: ..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="announcement-content">Content</Label>
          <Textarea
            id="announcement-content"
            placeholder="We're excited to announce..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px]"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Target: All Users</Badge>
          </div>
          <Button onClick={handleSend} disabled={!title || !content || isSending}>
            <Send01 size={14} className="mr-1" aria-hidden="true" />
            {isSending ? 'Sending...' : 'Send Announcement'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Announcement preview component.
 */
export function AnnouncementPreview({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <h4 className="font-medium mb-2">{title || 'Announcement Title'}</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {content || 'Announcement content will appear here...'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

const logColumnHelper = createColumnHelper<EmailDeliveryLog>();

/**
 * Email delivery logs table.
 */
export function EmailDeliveryLogs({
  logs,
  loading,
}: {
  logs: EmailDeliveryLog[];
  loading: boolean;
}) {
  const columns = useMemo<ColumnDef<EmailDeliveryLog, unknown>[]>(
    () => [
      logColumnHelper.accessor('to_email', {
        header: 'Recipient',
        cell: ({ getValue }) => (
          <span className="text-sm font-mono">{getValue()}</span>
        ),
      }),
      logColumnHelper.accessor('subject', {
        header: 'Subject',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
            {getValue() || '—'}
          </span>
        ),
      }),
      logColumnHelper.accessor('template_type', {
        header: 'Type',
        cell: ({ getValue }) => (
          <Badge variant="outline" className="text-2xs">
            {getValue() || 'transactional'}
          </Badge>
        ),
      }),
      logColumnHelper.accessor('status', {
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={getValue()} type="email" />,
      }),
      logColumnHelper.accessor('created_at', {
        header: 'Sent',
        cell: ({ getValue }) => {
          const val = getValue();
          return (
          <span className="text-xs text-muted-foreground">
            {val ? formatDistanceToNow(new Date(val), { addSuffix: true }) : '—'}
          </span>
        );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Delivery Logs</CardTitle>
        <CardDescription>Recent email delivery status</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          table={table}
          columns={columns}
          isLoading={loading}
          emptyMessage="No delivery logs found"
        />
      </CardContent>
    </Card>
  );
}

/**
 * Email delivery stats cards.
 */
export function EmailDeliveryStats({
  stats,
  loading,
}: {
  stats: EmailStats;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    { label: 'Sent', value: stats.sent, icon: Send01, color: 'text-foreground' },
    { label: 'Delivered', value: stats.delivered, icon: Check, color: 'text-status-active' },
    { label: 'Opened', value: stats.opened, icon: Eye, color: 'text-primary' },
    { label: 'Clicked', value: stats.clicked, icon: Mail01, color: 'text-primary' },
    { label: 'Bounced', value: stats.bounced, icon: AlertCircle, color: 'text-destructive' },
    { label: 'Failed', value: stats.failed, icon: AlertCircle, color: 'text-destructive' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statItems.map(({ label, value, icon: Icon, color }) => (
        <Card key={label}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <Icon size={16} className={color} aria-hidden="true" />
              <span className="text-2xl font-bold">{formatCompactNumber(value)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Send test email dialog.
 */
export function SendTestEmailDialog({
  open,
  onOpenChange,
  onSend,
  templateName,
  isSending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (email: string) => Promise<void>;
  templateName?: string;
  isSending?: boolean;
}) {
  const [email, setEmail] = useState('');

  const handleSend = async () => {
    if (email) {
      await onSend(email);
      setEmail('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Test Email</DialogTitle>
          <DialogDescription>
            Send a test email using the "{templateName}" template
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">Recipient Email</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="test@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!email || isSending}>
            {isSending ? 'Sending...' : 'Send Test'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
