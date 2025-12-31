/**
 * Email Templates Test Page
 * 
 * Dev-only page for previewing and testing email templates.
 * Renders all email templates with mock data controls.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Copy01, Eye, Code01, Monitor01, Phone01 } from '@untitledui/icons';
import { toast } from 'sonner';
import {
  generateTeamInvitationEmail,
  generateNotificationEmail,
  generateBookingConfirmationEmail,
  generateScheduledReportEmail,
  type TeamInvitationData,
  type NotificationData,
  type BookingConfirmationData,
  type ScheduledReportData,
} from '@/lib/email-templates';

type PreviewWidth = 'mobile' | 'desktop';

interface EmailPreviewProps {
  title: string;
  html: string;
  width: PreviewWidth;
  showSource: boolean;
}

function EmailPreview({ title, html, width, showSource }: EmailPreviewProps) {
  const iframeWidth = width === 'mobile' ? 375 : 600;

  const copyHtml = () => {
    navigator.clipboard.writeText(html);
    toast.success('HTML copied to clipboard');
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Button variant="ghost" size="sm" onClick={copyHtml}>
          <Copy01 size={16} className="mr-1" />
          Copy HTML
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {showSource ? (
          <pre className="p-4 text-xs overflow-auto max-h-[500px] bg-muted">
            <code>{html}</code>
          </pre>
        ) : (
          <div className="flex justify-center bg-muted/50 p-4">
            <iframe
              srcDoc={html}
              style={{ width: iframeWidth, height: 600, border: 'none', background: '#f5f5f5' }}
              title={title}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function EmailTemplatesTest() {
  // Global controls
  const [previewWidth, setPreviewWidth] = useState<PreviewWidth>('desktop');
  const [showSource, setShowSource] = useState(false);

  // Team Invitation data
  const [invitationData, setInvitationData] = useState<TeamInvitationData>({
    invitedBy: 'John Smith',
    companyName: 'Acme Corporation',
    signupUrl: 'https://getpilot.io/signup?token=abc123',
  });

  // Notification data
  const [notificationData, setNotificationData] = useState<NotificationData>({
    title: 'New Lead Captured',
    message: 'A new lead has been captured from your chat widget. Sarah Johnson expressed interest in your Enterprise plan.',
    actionUrl: 'https://getpilot.io/leads',
    actionLabel: 'View Lead',
    type: 'team',
  });

  // Booking data
  const [bookingData, setBookingData] = useState<BookingConfirmationData>({
    visitorName: 'Michael Chen',
    eventType: 'Product Demo',
    date: 'Thursday, January 15, 2025',
    time: '2:00 PM',
    timezone: 'EST',
    location: 'Google Meet',
    notes: 'Looking forward to showing you our new features!',
    calendarLink: 'https://calendar.google.com/event?id=abc123',
  });

  // Report data
  const [reportData, setReportData] = useState<ScheduledReportData>({
    reportName: 'Weekly Analytics Report',
    dateRange: 'Jan 6 - Jan 12, 2025',
    metrics: [
      { label: 'Total Conversations', value: '1,247', change: '+12.5%' },
      { label: 'Leads Captured', value: '89', change: '+8.3%' },
      { label: 'Avg. Response Time', value: '1.2s', change: '-15%' },
      { label: 'Satisfaction Rate', value: '94%', change: '+2.1%' },
    ],
    viewReportUrl: 'https://getpilot.io/analytics',
  });

  return (
    <div className="h-screen bg-background overflow-auto">
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Email Templates</h1>
            <p className="text-muted-foreground text-sm">Preview and test email templates with mock data</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Width Toggle */}
            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
              <Button
                variant={previewWidth === 'mobile' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setPreviewWidth('mobile')}
              >
                <Phone01 size={16} className="mr-1" />
                Mobile
              </Button>
              <Button
                variant={previewWidth === 'desktop' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setPreviewWidth('desktop')}
              >
                <Monitor01 size={16} className="mr-1" />
                Desktop
              </Button>
            </div>

            {/* Source Toggle */}
            <div className="flex items-center gap-2">
              <Label htmlFor="show-source" className="text-sm">
                {showSource ? <Code01 size={16} /> : <Eye size={16} />}
              </Label>
              <Switch
                id="show-source"
                checked={showSource}
                onCheckedChange={setShowSource}
              />
              <span className="text-sm text-muted-foreground">
                {showSource ? 'Source' : 'Preview'}
              </span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="invitation" className="space-y-6">
          <TabsList>
            <TabsTrigger value="invitation">Team Invitation</TabsTrigger>
            <TabsTrigger value="notification">Notification</TabsTrigger>
            <TabsTrigger value="booking">Booking Confirmation</TabsTrigger>
            <TabsTrigger value="report">Scheduled Report</TabsTrigger>
          </TabsList>

          {/* Team Invitation */}
          <TabsContent value="invitation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Mock Data Controls</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inv-by">Invited By</Label>
                  <Input
                    id="inv-by"
                    value={invitationData.invitedBy}
                    onChange={(e) => setInvitationData({ ...invitationData, invitedBy: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv-company">Company Name</Label>
                  <Input
                    id="inv-company"
                    value={invitationData.companyName}
                    onChange={(e) => setInvitationData({ ...invitationData, companyName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv-url">Signup URL</Label>
                  <Input
                    id="inv-url"
                    value={invitationData.signupUrl}
                    onChange={(e) => setInvitationData({ ...invitationData, signupUrl: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
            <EmailPreview
              title="Team Invitation Email"
              html={generateTeamInvitationEmail(invitationData)}
              width={previewWidth}
              showSource={showSource}
            />
          </TabsContent>

          {/* Notification */}
          <TabsContent value="notification" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Mock Data Controls</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="notif-title">Title</Label>
                  <Input
                    id="notif-title"
                    value={notificationData.title}
                    onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notif-type">Type</Label>
                  <Select
                    value={notificationData.type}
                    onValueChange={(v) => setNotificationData({ ...notificationData, type: v as NotificationData['type'] })}
                  >
                    <SelectTrigger id="notif-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="team">Team</SelectItem>
                      <SelectItem value="scope_work">Scope Work</SelectItem>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="notif-message">Message</Label>
                  <Input
                    id="notif-message"
                    value={notificationData.message}
                    onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notif-action-url">Action URL</Label>
                  <Input
                    id="notif-action-url"
                    value={notificationData.actionUrl}
                    onChange={(e) => setNotificationData({ ...notificationData, actionUrl: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notif-action-label">Action Label</Label>
                  <Input
                    id="notif-action-label"
                    value={notificationData.actionLabel}
                    onChange={(e) => setNotificationData({ ...notificationData, actionLabel: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
            <EmailPreview
              title="Notification Email"
              html={generateNotificationEmail(notificationData)}
              width={previewWidth}
              showSource={showSource}
            />
          </TabsContent>

          {/* Booking Confirmation */}
          <TabsContent value="booking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Mock Data Controls</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="book-name">Visitor Name</Label>
                  <Input
                    id="book-name"
                    value={bookingData.visitorName}
                    onChange={(e) => setBookingData({ ...bookingData, visitorName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="book-type">Event Type</Label>
                  <Input
                    id="book-type"
                    value={bookingData.eventType}
                    onChange={(e) => setBookingData({ ...bookingData, eventType: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="book-date">Date</Label>
                  <Input
                    id="book-date"
                    value={bookingData.date}
                    onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="book-time">Time</Label>
                  <Input
                    id="book-time"
                    value={bookingData.time}
                    onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="book-tz">Timezone</Label>
                  <Input
                    id="book-tz"
                    value={bookingData.timezone}
                    onChange={(e) => setBookingData({ ...bookingData, timezone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="book-loc">Location</Label>
                  <Input
                    id="book-loc"
                    value={bookingData.location || ''}
                    onChange={(e) => setBookingData({ ...bookingData, location: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
            <EmailPreview
              title="Booking Confirmation Email"
              html={generateBookingConfirmationEmail(bookingData)}
              width={previewWidth}
              showSource={showSource}
            />
          </TabsContent>

          {/* Scheduled Report */}
          <TabsContent value="report" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Mock Data Controls</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report-name">Report Name</Label>
                  <Input
                    id="report-name"
                    value={reportData.reportName}
                    onChange={(e) => setReportData({ ...reportData, reportName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-range">Date Range</Label>
                  <Input
                    id="report-range"
                    value={reportData.dateRange}
                    onChange={(e) => setReportData({ ...reportData, dateRange: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
            <EmailPreview
              title="Scheduled Report Email"
              html={generateScheduledReportEmail(reportData)}
              width={previewWidth}
              showSource={showSource}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
