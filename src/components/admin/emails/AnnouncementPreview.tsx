/**
 * AnnouncementPreview Component
 * 
 * Preview component for announcements.
 * 
 * @module components/admin/emails/AnnouncementPreview
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnnouncementPreviewProps {
  /** Announcement title */
  title: string;
  /** Announcement content */
  content: string;
}

/**
 * Announcement preview component.
 */
export function AnnouncementPreview({ title, content }: AnnouncementPreviewProps) {
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
