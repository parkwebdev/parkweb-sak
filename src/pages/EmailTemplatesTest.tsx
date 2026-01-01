/**
 * Email Templates Test Page
 * 
 * Dev-only page for previewing and testing email templates with sidebar navigation.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Copy01, Send01, Loading02, ChevronDown } from '@untitledui/icons';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { EmailTemplateSidebar, type EmailTemplateType } from '@/components/email/EmailTemplateSidebar';
import {
  generateTeamInvitationEmail,
  generateBookingConfirmationEmail,
  generateScheduledReportEmail,
  generateWeeklyReportEmail,
  generatePasswordResetEmail,
  generateSignupConfirmationEmail,
  generateSupabasePasswordResetEmail,
  generateSupabaseSignupConfirmationEmail,
  generateSupabaseTeamInvitationEmail,
  generateBookingCancellationEmail,
  generateBookingReminderEmail,
  generateNewLeadNotificationEmail,
  
  generateWelcomeEmail,
  generateBookingRescheduledEmail,
  
  generateWebhookFailureAlertEmail,
  generateTeamMemberRemovedEmail,
  generateFeatureAnnouncementEmail,
  type TeamInvitationData,
  type BookingConfirmationData,
  type ScheduledReportData,
  type WeeklyReportData,
  type PasswordResetData,
  type SignupConfirmationData,
  type BookingCancellationData,
  type BookingReminderData,
  type NewLeadNotificationData,
  
  type WelcomeEmailData,
  type BookingRescheduledData,
  
  type WebhookFailureAlertData,
  type TeamMemberRemovedData,
  type FeatureAnnouncementData,
} from '@/lib/email-templates';

type PreviewWidth = 'mobile' | 'desktop';

interface EmailPreviewProps {
  html: string;
  width: PreviewWidth;
  showSource: boolean;
  templateType: string;
  subject: string;
  darkMode: boolean;
}

function EmailPreview({ html, width, showSource, templateType, subject, darkMode }: EmailPreviewProps) {
  const iframeWidth = width === 'mobile' ? 375 : 600;
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const copyHtml = () => {
    navigator.clipboard.writeText(html);
    toast.success('HTML copied to clipboard');
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-test-email', {
        body: { to: testEmail, templateType, html, subject },
      });

      if (error) throw error;
      toast.success(`Test email sent to ${testEmail}`);
      setTestEmail('');
    } catch (error: any) {
      console.error('Failed to send test email:', error);
      toast.error(error.message || 'Failed to send test email');
    } finally {
      setIsSending(false);
    }
  };

  const getPreviewHtml = () => {
    const lightModeStyles = `
      <style type="text/css">
        .email-bg { background-color: #f5f5f5 !important; }
        .email-card { background-color: #ffffff !important; }
        .email-text { color: #171717 !important; }
        .email-text-muted { color: #737373 !important; }
        .email-border { border-color: #e5e5e5 !important; }
        .email-btn { background-color: #171717 !important; }
        .email-btn-text { color: #ffffff !important; }
        .email-detail-bg { background-color: #f5f5f5 !important; }
        body { background-color: #f5f5f5 !important; }
        table.email-bg { background-color: #f5f5f5 !important; }
      </style>
    `;

    const darkModeStyles = `
      <style type="text/css">
        .email-bg { background-color: #0a0a0a !important; }
        .email-card { background-color: #171717 !important; }
        .email-text { color: #fafafa !important; }
        .email-text-muted { color: #a3a3a3 !important; }
        .email-border { border-color: #262626 !important; }
        .email-btn { background-color: #fafafa !important; }
        .email-btn-text { color: #171717 !important; }
        .email-detail-bg { background-color: #0a0a0a !important; }
        body { background-color: #0a0a0a !important; }
        table.email-bg { background-color: #0a0a0a !important; }
      </style>
    `;

    const stylesToInject = darkMode ? darkModeStyles : lightModeStyles;
    return html.replace('</head>', `${stylesToInject}</head>`);
  };

  const previewHtml = getPreviewHtml();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b gap-4">
        <CardTitle className="text-sm font-medium shrink-0">
          {showSource ? 'HTML Source' : `Preview (${width === 'mobile' ? '375px' : '600px'})`}
          {darkMode && !showSource && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">• Dark Mode</span>
          )}
        </CardTitle>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <Input
            type="email"
            placeholder="test@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="max-w-[200px] h-8 text-sm"
          />
          <Button variant="outline" size="sm" onClick={sendTestEmail} disabled={isSending || !testEmail}>
            {isSending ? <Loading02 size={16} className="mr-1 animate-spin" /> : <Send01 size={16} className="mr-1" />}
            Send Test
          </Button>
          <Button variant="ghost" size="sm" onClick={copyHtml}>
            <Copy01 size={16} className="mr-1" />
            Copy
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {showSource ? (
          <pre className="p-4 text-xs overflow-auto max-h-[600px] bg-muted">
            <code>{html}</code>
          </pre>
        ) : (
          <div 
            className="flex justify-center p-4 transition-colors duration-200"
            style={{ backgroundColor: darkMode ? '#0d0d0d' : '#f5f5f5' }}
          >
            <iframe
              srcDoc={previewHtml}
              style={{ 
                width: iframeWidth, 
                height: 650, 
                border: 'none', 
                background: darkMode ? '#1a1a1a' : '#ffffff',
                borderRadius: 8,
              }}
              title="Email Preview"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function EmailTemplatesTest() {
  const [activeTemplate, setActiveTemplate] = useState<EmailTemplateType>('invitation');
  const [previewWidth, setPreviewWidth] = useState<PreviewWidth>('desktop');
  const [showSource, setShowSource] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [supabaseExportMode, setSupabaseExportMode] = useState(false);

  // Check if current template supports Supabase export
  const supportsSupabaseExport = activeTemplate === 'password-reset' || activeTemplate === 'signup-confirmation' || activeTemplate === 'invitation';

  // Existing template data
  const [invitationData, setInvitationData] = useState<TeamInvitationData>({
    invitedBy: 'John Smith',
    companyName: 'Acme Corporation',
    signupUrl: 'https://app.getpilot.io/signup?token=abc123',
  });

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

  const [reportData, setReportData] = useState<ScheduledReportData>({
    reportName: 'scheduled report',
    dateRange: 'Dec 1 - Dec 31, 2025',
    format: 'pdf',
    viewReportUrl: 'https://app.getpilot.io/analytics',
  });

  const [weeklyReportData, setWeeklyReportData] = useState<WeeklyReportData>({
    reportName: 'Weekly Report',
    dateRange: 'Jan 6 - Jan 12, 2025',
    metrics: [
      { label: 'Conversations', value: '1,247', change: '+12.5%' },
      { label: 'Leads', value: '89', change: '+8.3%' },
      { label: 'Conversion Rate', value: '7.1%', change: '+2.1%' },
      { label: 'Satisfaction', value: '4.6/5', change: '+0.3' },
    ],
    viewReportUrl: 'https://app.getpilot.io/analytics',
  });

  const [passwordResetData, setPasswordResetData] = useState<PasswordResetData>({
    userName: 'Alex',
    resetUrl: 'https://app.getpilot.io/reset-password?token=abc123',
    expiresIn: '1 hour',
  });

  const [signupConfirmationData, setSignupConfirmationData] = useState<SignupConfirmationData>({
    userName: 'Alex',
    confirmationUrl: 'https://app.getpilot.io/auth/confirm?token=abc123',
    expiresIn: '24 hours',
  });

  // NEW template data
  const [bookingCancellationData, setBookingCancellationData] = useState<BookingCancellationData>({
    visitorName: 'Michael Chen',
    eventType: 'Product Demo',
    date: 'Thursday, January 15, 2025',
    time: '2:00 PM',
    timezone: 'EST',
    reason: 'Scheduling conflict',
    rescheduleUrl: 'https://app.getpilot.io/book',
  });

  const [bookingReminderData, setBookingReminderData] = useState<BookingReminderData>({
    visitorName: 'Michael Chen',
    eventType: 'Product Demo',
    date: 'Thursday, January 15, 2025',
    time: '2:00 PM',
    timezone: 'EST',
    location: 'Google Meet',
    reminderTime: '24 hours',
    calendarLink: 'https://calendar.google.com/event?id=abc123',
  });

  const [newLeadData, setNewLeadData] = useState<NewLeadNotificationData>({
    leadName: 'Sarah Johnson',
    leadEmail: 'sarah@example.com',
    leadPhone: '+1 (555) 123-4567',
    source: 'Ari Agent',
    message: 'Interested in the Enterprise plan. Need a demo.',
    viewLeadUrl: 'https://app.getpilot.io/leads/123',
  });

  const [welcomeData, setWelcomeData] = useState<WelcomeEmailData>({
    userName: 'Alex',
    companyName: 'Acme Inc',
    getStartedUrl: 'https://app.getpilot.io/onboarding',
  });

  const [bookingRescheduledData, setBookingRescheduledData] = useState<BookingRescheduledData>({
    visitorName: 'Michael Chen',
    eventType: 'Product Demo',
    oldDate: 'Thursday, January 15, 2025',
    oldTime: '2:00 PM',
    newDate: 'Friday, January 17, 2025',
    newTime: '3:00 PM',
    timezone: 'EST',
    calendarLink: 'https://calendar.google.com/event?id=abc123',
  });

  const [webhookFailureData, setWebhookFailureData] = useState<WebhookFailureAlertData>({
    webhookName: 'CRM Sync',
    endpoint: 'https://api.example.com/webhook',
    errorCode: 500,
    errorMessage: 'Internal Server Error: Connection timeout after 30s',
    failedAt: 'Jan 10, 2025 at 3:45 PM',
    retryCount: 3,
    configureUrl: 'https://app.getpilot.io/settings/webhooks',
  });

  const [teamMemberRemovedData, setTeamMemberRemovedData] = useState<TeamMemberRemovedData>({
    memberName: 'Jane Doe',
    companyName: 'Acme Corporation',
  });

  const [featureAnnouncementData, setFeatureAnnouncementData] = useState<FeatureAnnouncementData>({
    featureTitle: 'Introducing AI-Powered Lead Scoring',
    description: 'Our new AI-powered lead scoring automatically prioritizes your most promising leads based on conversation context, engagement patterns, and buying signals. Focus on what matters most.',
    imageUrl: 'https://placehold.co/520x260/171717/fafafa?text=AI+Lead+Scoring',
    learnMoreUrl: 'https://app.getpilot.io/features/lead-scoring',
  });

  const getTemplateHtml = (): string => {
    // For Supabase export mode, return the template variable version
    if (supabaseExportMode) {
      switch (activeTemplate) {
        case 'password-reset': return generateSupabasePasswordResetEmail();
        case 'signup-confirmation': return generateSupabaseSignupConfirmationEmail();
        case 'invitation': return generateSupabaseTeamInvitationEmail();
        default: break;
      }
    }
    
    switch (activeTemplate) {
      case 'invitation': return generateTeamInvitationEmail(invitationData);
      case 'booking': return generateBookingConfirmationEmail(bookingData);
      case 'report': return generateScheduledReportEmail(reportData);
      case 'weekly-report': return generateWeeklyReportEmail(weeklyReportData);
      case 'password-reset': return generatePasswordResetEmail(passwordResetData);
      case 'signup-confirmation': return generateSignupConfirmationEmail(signupConfirmationData);
      case 'booking-cancellation': return generateBookingCancellationEmail(bookingCancellationData);
      case 'booking-reminder': return generateBookingReminderEmail(bookingReminderData);
      case 'new-lead': return generateNewLeadNotificationEmail(newLeadData);
      case 'welcome': return generateWelcomeEmail(welcomeData);
      case 'booking-rescheduled': return generateBookingRescheduledEmail(bookingRescheduledData);
      case 'webhook-failure': return generateWebhookFailureAlertEmail(webhookFailureData);
      case 'team-member-removed': return generateTeamMemberRemovedEmail(teamMemberRemovedData);
      case 'feature-announcement': return generateFeatureAnnouncementEmail(featureAnnouncementData);
      default: return '';
    }
  };

  const getTemplateSubject = (): string => {
    switch (activeTemplate) {
      case 'invitation': return `${invitationData.invitedBy} invited you to join ${invitationData.companyName} on Pilot`;
      case 'booking': return `Confirmed: ${bookingData.eventType} on ${bookingData.date}`;
      case 'report': return `${reportData.reportName} — ${reportData.dateRange}`;
      case 'weekly-report': return `${weeklyReportData.reportName} — ${weeklyReportData.dateRange}`;
      case 'password-reset': return 'Reset your password';
      case 'signup-confirmation': return 'Confirm your email address';
      case 'booking-cancellation': return `Cancelled: ${bookingCancellationData.eventType} on ${bookingCancellationData.date}`;
      case 'booking-reminder': return `Reminder: ${bookingReminderData.eventType} in ${bookingReminderData.reminderTime}`;
      case 'new-lead': return `New lead: ${newLeadData.leadName}`;
      case 'welcome': return `Welcome to Pilot, ${welcomeData.userName}!`;
      case 'booking-rescheduled': return `Rescheduled: ${bookingRescheduledData.eventType}`;
      case 'webhook-failure': return `Webhook failed: ${webhookFailureData.webhookName}`;
      case 'team-member-removed': return `Removed from ${teamMemberRemovedData.companyName}`;
      case 'feature-announcement': return `New: ${featureAnnouncementData.featureTitle}`;
      default: return '';
    }
  };

  const renderMockDataControls = () => {
    switch (activeTemplate) {
      case 'invitation':
        return (
          <div className="p-4 grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inv-by" className="text-xs">Invited By</Label>
              <Input
                id="inv-by"
                value={invitationData.invitedBy}
                onChange={(e) => setInvitationData({ ...invitationData, invitedBy: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-company" className="text-xs">Company Name</Label>
              <Input
                id="inv-company"
                value={invitationData.companyName}
                onChange={(e) => setInvitationData({ ...invitationData, companyName: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-url" className="text-xs">Signup URL</Label>
              <Input
                id="inv-url"
                value={invitationData.signupUrl}
                onChange={(e) => setInvitationData({ ...invitationData, signupUrl: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        );

      case 'booking':
        return (
          <div className="p-4 grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Visitor Name</Label>
              <Input
                value={bookingData.visitorName}
                onChange={(e) => setBookingData({ ...bookingData, visitorName: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Event Type</Label>
              <Input
                value={bookingData.eventType}
                onChange={(e) => setBookingData({ ...bookingData, eventType: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Date</Label>
              <Input
                value={bookingData.date}
                onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Time</Label>
              <Input
                value={bookingData.time}
                onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Timezone</Label>
              <Input
                value={bookingData.timezone}
                onChange={(e) => setBookingData({ ...bookingData, timezone: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Location</Label>
              <Input
                value={bookingData.location || ''}
                onChange={(e) => setBookingData({ ...bookingData, location: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        );

      case 'report':
        return (
          <div className="p-4 grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Report Name</Label>
              <Input
                value={reportData.reportName}
                onChange={(e) => setReportData({ ...reportData, reportName: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Date Range</Label>
              <Input
                value={reportData.dateRange}
                onChange={(e) => setReportData({ ...reportData, dateRange: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Format</Label>
              <Select
                value={reportData.format || 'pdf'}
                onValueChange={(value: 'pdf' | 'csv') => setReportData({ ...reportData, format: value })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'weekly-report':
        return (
          <div className="p-4 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Report Name</Label>
              <Input
                value={weeklyReportData.reportName}
                onChange={(e) => setWeeklyReportData({ ...weeklyReportData, reportName: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Date Range</Label>
              <Input
                value={weeklyReportData.dateRange}
                onChange={(e) => setWeeklyReportData({ ...weeklyReportData, dateRange: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        );

      case 'password-reset':
        return (
          <div className="p-4 grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">User Name</Label>
              <Input
                value={passwordResetData.userName || ''}
                onChange={(e) => setPasswordResetData({ ...passwordResetData, userName: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Reset URL</Label>
              <Input
                value={passwordResetData.resetUrl}
                onChange={(e) => setPasswordResetData({ ...passwordResetData, resetUrl: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Expires In</Label>
              <Input
                value={passwordResetData.expiresIn || ''}
                onChange={(e) => setPasswordResetData({ ...passwordResetData, expiresIn: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        );

      case 'signup-confirmation':
        return (
          <div className="p-4 grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">User Name</Label>
              <Input
                value={signupConfirmationData.userName || ''}
                onChange={(e) => setSignupConfirmationData({ ...signupConfirmationData, userName: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Confirmation URL</Label>
              <Input
                value={signupConfirmationData.confirmationUrl}
                onChange={(e) => setSignupConfirmationData({ ...signupConfirmationData, confirmationUrl: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Expires In</Label>
              <Input
                value={signupConfirmationData.expiresIn || ''}
                onChange={(e) => setSignupConfirmationData({ ...signupConfirmationData, expiresIn: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        );

      case 'booking-cancellation':
        return (
          <div className="p-4 grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Visitor Name</Label>
              <Input
                value={bookingCancellationData.visitorName}
                onChange={(e) => setBookingCancellationData({ ...bookingCancellationData, visitorName: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Event Type</Label>
              <Input
                value={bookingCancellationData.eventType}
                onChange={(e) => setBookingCancellationData({ ...bookingCancellationData, eventType: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Date</Label>
              <Input
                value={bookingCancellationData.date}
                onChange={(e) => setBookingCancellationData({ ...bookingCancellationData, date: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Time</Label>
              <Input
                value={bookingCancellationData.time}
                onChange={(e) => setBookingCancellationData({ ...bookingCancellationData, time: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Reason</Label>
              <Input
                value={bookingCancellationData.reason || ''}
                onChange={(e) => setBookingCancellationData({ ...bookingCancellationData, reason: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        );

      case 'booking-reminder':
        return (
          <div className="p-4 grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Visitor Name</Label>
              <Input
                value={bookingReminderData.visitorName}
                onChange={(e) => setBookingReminderData({ ...bookingReminderData, visitorName: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Event Type</Label>
              <Input
                value={bookingReminderData.eventType}
                onChange={(e) => setBookingReminderData({ ...bookingReminderData, eventType: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Reminder Time</Label>
              <Input
                value={bookingReminderData.reminderTime}
                onChange={(e) => setBookingReminderData({ ...bookingReminderData, reminderTime: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        );

      case 'new-lead':
        return (
          <div className="p-4 grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Lead Name</Label>
              <Input
                value={newLeadData.leadName}
                onChange={(e) => setNewLeadData({ ...newLeadData, leadName: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Email</Label>
              <Input
                value={newLeadData.leadEmail || ''}
                onChange={(e) => setNewLeadData({ ...newLeadData, leadEmail: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Source</Label>
              <Input
                value={newLeadData.source}
                onChange={(e) => setNewLeadData({ ...newLeadData, source: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="col-span-3 space-y-2">
              <Label className="text-xs">Message</Label>
              <Input
                value={newLeadData.message || ''}
                onChange={(e) => setNewLeadData({ ...newLeadData, message: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        );

      case 'welcome':
        return (
          <div className="p-4 grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">User Name</Label>
              <Input
                value={welcomeData.userName}
                onChange={(e) => setWelcomeData({ ...welcomeData, userName: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Company</Label>
              <Input
                value={welcomeData.companyName || ''}
                onChange={(e) => setWelcomeData({ ...welcomeData, companyName: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Get Started URL</Label>
              <Input
                value={welcomeData.getStartedUrl}
                onChange={(e) => setWelcomeData({ ...welcomeData, getStartedUrl: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        );

      case 'booking-rescheduled':
        return (
          <div className="p-4 grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Visitor Name</Label>
              <Input
                value={bookingRescheduledData.visitorName}
                onChange={(e) => setBookingRescheduledData({ ...bookingRescheduledData, visitorName: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Old Date</Label>
              <Input
                value={bookingRescheduledData.oldDate}
                onChange={(e) => setBookingRescheduledData({ ...bookingRescheduledData, oldDate: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">New Date</Label>
              <Input
                value={bookingRescheduledData.newDate}
                onChange={(e) => setBookingRescheduledData({ ...bookingRescheduledData, newDate: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Old Time</Label>
              <Input
                value={bookingRescheduledData.oldTime}
                onChange={(e) => setBookingRescheduledData({ ...bookingRescheduledData, oldTime: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">New Time</Label>
              <Input
                value={bookingRescheduledData.newTime}
                onChange={(e) => setBookingRescheduledData({ ...bookingRescheduledData, newTime: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Timezone</Label>
              <Input
                value={bookingRescheduledData.timezone}
                onChange={(e) => setBookingRescheduledData({ ...bookingRescheduledData, timezone: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        );

      case 'webhook-failure':
        return (
          <div className="p-4 grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Webhook Name</Label>
              <Input
                value={webhookFailureData.webhookName}
                onChange={(e) => setWebhookFailureData({ ...webhookFailureData, webhookName: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Error Code</Label>
              <Input
                type="number"
                value={webhookFailureData.errorCode}
                onChange={(e) => setWebhookFailureData({ ...webhookFailureData, errorCode: Number(e.target.value) })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Retry Count</Label>
              <Input
                type="number"
                value={webhookFailureData.retryCount}
                onChange={(e) => setWebhookFailureData({ ...webhookFailureData, retryCount: Number(e.target.value) })}
                className="h-8 text-sm"
              />
            </div>
            <div className="col-span-3 space-y-2">
              <Label className="text-xs">Error Message</Label>
              <Input
                value={webhookFailureData.errorMessage}
                onChange={(e) => setWebhookFailureData({ ...webhookFailureData, errorMessage: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        );

      case 'team-member-removed':
        return (
          <div className="p-4 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Member Name</Label>
              <Input
                value={teamMemberRemovedData.memberName}
                onChange={(e) => setTeamMemberRemovedData({ ...teamMemberRemovedData, memberName: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Company Name</Label>
              <Input
                value={teamMemberRemovedData.companyName}
                onChange={(e) => setTeamMemberRemovedData({ ...teamMemberRemovedData, companyName: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        );

      case 'feature-announcement':
        return (
          <div className="p-4 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Feature Title</Label>
              <Input
                value={featureAnnouncementData.featureTitle}
                onChange={(e) => setFeatureAnnouncementData({ ...featureAnnouncementData, featureTitle: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Image URL</Label>
              <Input
                value={featureAnnouncementData.imageUrl || ''}
                onChange={(e) => setFeatureAnnouncementData({ ...featureAnnouncementData, imageUrl: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-xs">Description</Label>
              <Input
                value={featureAnnouncementData.description}
                onChange={(e) => setFeatureAnnouncementData({ ...featureAnnouncementData, description: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-background flex min-h-0">
      <EmailTemplateSidebar 
        activeTemplate={activeTemplate} 
        onTemplateChange={setActiveTemplate}
        previewWidth={previewWidth}
        onPreviewWidthChange={setPreviewWidth}
        darkMode={darkMode}
        onDarkModeChange={setDarkMode}
      />

      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Email Templates</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Preview and test email templates with mock data</p>
            </div>
            <div className="flex items-center gap-4">
              {supportsSupabaseExport && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
                  <Label htmlFor="supabase-export" className="text-xs text-muted-foreground">Supabase Export</Label>
                  <Switch 
                    id="supabase-export" 
                    checked={supabaseExportMode} 
                    onCheckedChange={setSupabaseExportMode}
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Label htmlFor="show-source" className="text-xs text-muted-foreground">Source</Label>
                <Switch id="show-source" checked={showSource} onCheckedChange={setShowSource} />
              </div>
            </div>
          </div>

          <Collapsible defaultOpen>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Mock Data</CardTitle>
                    <ChevronDown size={16} className="text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {supabaseExportMode ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    <p>Supabase Export Mode is enabled. The template uses Supabase variables like <code className="px-1 py-0.5 bg-muted rounded text-xs font-mono">{'{{ .ConfirmationURL }}'}</code> instead of mock data.</p>
                    <p className="mt-2">Copy the HTML and paste it into your Supabase Dashboard → Authentication → Email Templates.</p>
                  </div>
                ) : (
                  renderMockDataControls()
                )}
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <EmailPreview
            html={getTemplateHtml()}
            width={previewWidth}
            showSource={showSource}
            darkMode={darkMode}
            templateType={activeTemplate}
            subject={getTemplateSubject()}
          />
        </div>
      </main>
    </div>
  );
}
