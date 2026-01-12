/**
 * AnnouncementBuilder Component
 * 
 * Form for creating feature announcements.
 * 
 * @module components/admin/emails/AnnouncementBuilder
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send01 } from '@untitledui/icons';

interface AnnouncementData {
  title: string;
  content: string;
  targetAudience: string;
}

interface AnnouncementBuilderProps {
  /** Callback when announcement is sent */
  onSend: (announcement: AnnouncementData) => Promise<void>;
  /** Whether send is in progress */
  isSending?: boolean;
}

/**
 * Announcement builder component.
 */
export function AnnouncementBuilder({ onSend, isSending }: AnnouncementBuilderProps) {
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
