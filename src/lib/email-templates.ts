/**
 * Professional Email Templates for Pilot
 * 
 * Design principles:
 * - Table-based layouts for email client compatibility (Outlook, Gmail, Apple Mail)
 * - Inline styles (many email clients strip <style> tags)
 * - Dark mode support via meta tags and @media queries
 * - Bulletproof buttons using border technique
 * - System font stack for consistent rendering
 * - 600px max-width (industry standard)
 */

// =============================================================================
// TYPES
// =============================================================================

export interface TeamInvitationData {
  invitedBy: string;
  companyName: string;
  signupUrl: string;
}

export interface BookingConfirmationData {
  visitorName: string;
  eventType: string;
  date: string;
  time: string;
  timezone: string;
  location?: string;
  notes?: string;
  calendarLink?: string;
}

export interface ScheduledReportData {
  reportName: string;
  dateRange: string;
  format?: 'pdf' | 'csv';
  viewReportUrl: string;
}

export interface WeeklyReportData {
  reportName: string;
  dateRange: string;
  metrics: {
    label: string;
    value: string;
    change?: string;
  }[];
  viewReportUrl: string;
}

export interface PasswordResetData {
  userName?: string;
  resetUrl: string;
  expiresIn?: string;
}

export interface EmailVerificationData {
  userName?: string;
  verificationUrl: string;
  expiresIn?: string;
}

// NEW TEMPLATE DATA TYPES

export interface BookingCancellationData {
  visitorName: string;
  eventType: string;
  date: string;
  time: string;
  timezone: string;
  reason?: string;
  rescheduleUrl?: string;
}

export interface BookingReminderData {
  visitorName: string;
  eventType: string;
  date: string;
  time: string;
  timezone: string;
  location?: string;
  reminderTime: string; // e.g., "24 hours", "1 hour"
  calendarLink?: string;
}

export interface NewLeadNotificationData {
  leadName: string;
  leadEmail?: string;
  leadPhone?: string;
  source?: string; // Defaults to 'Ari Agent'
  message?: string;
  viewLeadUrl: string;
}

export interface WelcomeEmailData {
  userName: string;
  companyName?: string;
  getStartedUrl: string;
}

export interface BookingRescheduledData {
  visitorName: string;
  eventType: string;
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  timezone: string;
  calendarLink?: string;
}

export interface WebhookFailureAlertData {
  webhookName: string;
  endpoint: string;
  errorCode: number;
  errorMessage: string;
  failedAt: string;
  retryCount: number;
  configureUrl: string;
}

/**
 * Team member removal notification data.
 */
export interface TeamMemberRemovedData {
  memberName: string;
  companyName: string;
}

export interface FeatureAnnouncementData {
  featureTitle: string;
  description: string;
  imageUrl?: string;
  learnMoreUrl: string;
}

// =============================================================================
// DESIGN TOKENS
// =============================================================================

const colors = {
  // Light mode (default)
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#171717',
  textMuted: '#737373',
  border: '#e5e5e5',
  buttonBg: '#171717',
  buttonText: '#ffffff',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  // Dark mode overrides
  dark: {
    background: '#0a0a0a',
    card: '#171717',
    text: '#fafafa',
    textMuted: '#a3a3a3',
    border: '#262626',
    buttonBg: '#fafafa',
    buttonText: '#171717',
  },
};

const fonts = {
  stack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

// =============================================================================
// BASE STYLES
// =============================================================================

const getBaseStyles = (): string => `
  body, table, td, p, a, li, blockquote {
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
  }
  table, td {
    mso-table-lspace: 0pt;
    mso-table-rspace: 0pt;
  }
  img {
    -ms-interpolation-mode: bicubic;
    border: 0;
    height: auto;
    line-height: 100%;
    outline: none;
    text-decoration: none;
  }
  
  @media (prefers-color-scheme: dark) {
    .email-bg { background-color: ${colors.dark.background} !important; }
    .email-card { background-color: ${colors.dark.card} !important; }
    .email-text { color: ${colors.dark.text} !important; }
    .email-text-muted { color: ${colors.dark.textMuted} !important; }
    .email-border { border-color: ${colors.dark.border} !important; }
    .email-btn { background-color: ${colors.dark.buttonBg} !important; }
    .email-btn-text { color: ${colors.dark.buttonText} !important; }
    .email-detail-bg { background-color: ${colors.dark.background} !important; }
  }
  
  @media only screen and (max-width: 600px) {
    .email-container { width: 100% !important; }
    .email-content { padding: 24px !important; }
  }
`;

// =============================================================================
// EMAIL WRAPPER
// =============================================================================

interface WrapperOptions {
  preheaderText?: string;
  content: string;
  unsubscribeUrl?: string;
}

const generateWrapper = ({ preheaderText, content, unsubscribeUrl }: WrapperOptions): string => {
  const year = new Date().getFullYear();
  
  const unsubscribeSection = unsubscribeUrl 
    ? `<p class="email-text-muted" style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.5; color: ${colors.textMuted};"><a href="${unsubscribeUrl}" style="color: ${colors.textMuted}; text-decoration: underline;">Manage notification preferences</a></p>`
    : '';
  
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Pilot</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">${getBaseStyles()}</style>
</head>
<body class="email-bg" style="margin: 0; padding: 0; width: 100%; background-color: ${colors.background}; font-family: ${fonts.stack};">
  ${preheaderText ? `<div style="display: none; font-size: 1px; color: ${colors.background}; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">${preheaderText}${'&nbsp;'.repeat(50)}</div>` : ''}
  
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-bg" style="background-color: ${colors.background};">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="email-container email-card" style="max-width: 600px; width: 100%; background-color: ${colors.card}; border-radius: 8px;">
          
          <!-- Header -->
          <tr>
            <td class="email-content" style="padding: 32px 40px 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/Email/Pilot%20Email%20Logo%20%40%20481px.png" alt="Pilot" width="20" height="20" style="display: block; width: 20px; height: 20px;" />
                  </td>
                  <td style="vertical-align: middle; padding-left: 6px;">
                    <span class="email-text" style="font-size: 18px; font-weight: 700; color: ${colors.text};">Pilot</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="email-content" style="padding: 32px 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="email-content email-border" style="padding: 24px 40px; border-top: 1px solid ${colors.border};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="email-text-muted" style="font-size: 13px; line-height: 1.5; color: ${colors.textMuted};">© ${year} Pilot</td>
                  <td style="padding: 0 12px;">
                    <div style="width: 1px; height: 16px; background-color: ${colors.border};"></div>
                  </td>
                  <td>
                    <a href="https://www.linkedin.com/company/getpilot" target="_blank" style="display: inline-block; vertical-align: middle; margin-right: 8px;">
                      <img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/Email/LinkedIn%20Icon@4x.png" alt="LinkedIn" height="18" style="display: block; height: 18px; width: auto;" />
                    </a>
                    <a href="https://www.facebook.com/getpilot" target="_blank" style="display: inline-block; vertical-align: middle;">
                      <img src="https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/Email/Facebook%20Icon@4x.png" alt="Facebook" height="18" style="display: block; height: 18px; width: auto;" />
                    </a>
                  </td>
                </tr>
              </table>
              ${unsubscribeSection}
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// =============================================================================
// COMPONENTS
// =============================================================================

const heading = (text: string): string => `
  <h1 class="email-text" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; line-height: 1.3; color: ${colors.text};">${text}</h1>
`;

const paragraph = (text: string, muted = false): string => {
  const color = muted ? colors.textMuted : colors.text;
  const className = muted ? 'email-text-muted' : 'email-text';
  return `<p class="${className}" style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: ${color};">${text}</p>`;
};

const button = (text: string, url: string, variant: 'primary' | 'secondary' = 'primary'): string => {
  const bgColor = variant === 'primary' ? colors.buttonBg : 'transparent';
  const textColor = variant === 'primary' ? colors.buttonText : colors.buttonBg;
  const border = variant === 'secondary' ? `border: 1px solid ${colors.border};` : '';
  
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="email-btn" style="border-radius: 6px; background-color: ${bgColor}; ${border}">
        <a href="${url}" target="_blank" class="email-btn-text" style="display: inline-block; font-family: ${fonts.stack}; font-size: 14px; font-weight: 600; color: ${textColor}; text-decoration: none; padding: 12px 24px; border-radius: 6px;">${text}</a>
      </td>
    </tr>
  </table>
`;
};

const spacer = (height = 24): string => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td style="height: ${height}px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
  </table>
`;

const detailRow = (label: string, value: string): string => `
  <tr>
    <td class="email-text-muted" style="padding: 8px 0; font-size: 14px; color: ${colors.textMuted}; width: 100px; vertical-align: top;">${label}</td>
    <td class="email-text" style="padding: 8px 0; font-size: 14px; color: ${colors.text}; font-weight: 500;">${value}</td>
  </tr>
`;

const badge = (text: string, color: string): string => `
  <span style="display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 600; color: ${color}; background-color: ${color}15; border-radius: 4px;">${text}</span>
`;

const divider = (): string => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td class="email-border" style="height: 1px; background-color: ${colors.border};"></td></tr>
  </table>
`;

const alertBox = (text: string, type: 'warning' | 'error' | 'success' = 'warning'): string => {
  const colorMap = { warning: colors.warning, error: colors.error, success: colors.success };
  const bgColor = colorMap[type];
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${bgColor}10; border-left: 4px solid ${bgColor}; border-radius: 4px;">
    <tr>
      <td style="padding: 16px;">
        <p style="margin: 0; font-size: 14px; line-height: 1.5; color: ${colors.text};">${text}</p>
      </td>
    </tr>
  </table>
`;
};

// =============================================================================
// EXISTING TEMPLATES
// =============================================================================

export function generateTeamInvitationEmail(data: TeamInvitationData): string {
  const content = `
    ${heading(`You're invited to join ${data.companyName}`)}
    ${paragraph(`<strong>${data.invitedBy}</strong> has invited you to collaborate on Pilot as part of ${data.companyName}.`)}
    ${paragraph('Pilot helps teams manage conversations, leads, and customer interactions with AI-powered assistance.', true)}
    ${spacer(8)}
    ${button('Accept Invitation', data.signupUrl)}
    ${spacer(24)}
    ${paragraph("If you weren't expecting this invitation, you can safely ignore this email.", true)}
  `;
  
  return generateWrapper({
    preheaderText: `${data.invitedBy} invited you to join ${data.companyName} on Pilot`,
    content,
    unsubscribeUrl: 'https://app.getpilot.io/settings?tab=notifications#team-emails',
  });
}

export function generateBookingConfirmationEmail(data: BookingConfirmationData): string {
  const content = `
    ${heading('Your booking is confirmed')}
    ${paragraph(`Hi <strong>${data.visitorName}</strong>, your appointment has been scheduled.`)}
    
    <!-- Event Card -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-detail-bg email-bg" style="background-color: ${colors.background}; border-radius: 8px;">
      <tr>
        <td style="padding: 20px;">
          <p class="email-text" style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: ${colors.text};">${data.eventType}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${detailRow('Date', data.date)}
            ${detailRow('Time', `${data.time} (${data.timezone})`)}
            ${data.location ? detailRow('Location', data.location) : ''}
            ${data.notes ? detailRow('Notes', data.notes) : ''}
          </table>
        </td>
      </tr>
    </table>
    
    ${data.calendarLink ? `${spacer(24)}${button('Add to Calendar', data.calendarLink)}` : ''}
  `;
  
  return generateWrapper({
    preheaderText: `Your ${data.eventType} is confirmed for ${data.date} at ${data.time}`,
    content,
    unsubscribeUrl: 'https://app.getpilot.io/settings?tab=notifications#booking-emails',
  });
}

export function generateScheduledReportEmail(data: ScheduledReportData): string {
  const formatBadge = data.format ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
      <tr>
        <td style="padding: 4px 10px; font-size: 12px; font-weight: 600; color: ${colors.textMuted}; background-color: ${colors.background}; border-radius: 4px; text-transform: uppercase;">
          ${data.format.toUpperCase()} Report
        </td>
      </tr>
    </table>
  ` : '';

  const content = `
    ${heading('Your Report is Ready')}
    ${formatBadge}
    ${paragraph(`Your <strong>${data.reportName}</strong> covering <strong>${data.dateRange}</strong> has been generated and is ready to download.`)}
    ${spacer(8)}
    ${button('Download Report', data.viewReportUrl)}
    ${spacer(24)}
    ${paragraph("This report was automatically generated based on your scheduled report settings.", true)}
  `;
  
  return generateWrapper({
    preheaderText: `Your ${data.reportName} for ${data.dateRange} is ready to download`,
    content,
    unsubscribeUrl: 'https://app.getpilot.io/settings?tab=notifications#report-emails',
  });
}

export function generateWeeklyReportEmail(data: WeeklyReportData): string {
  const metricsHtml = data.metrics.map(m => {
    const changeColor = m.change?.startsWith('+') || m.change?.startsWith('↑') ? '#22c55e' 
      : m.change?.startsWith('-') || m.change?.startsWith('↓') ? '#ef4444' 
      : colors.textMuted;
    
    return `
      <td width="50%" style="padding: 6px; vertical-align: top;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-detail-bg email-bg" style="background-color: ${colors.background}; border-radius: 8px;">
          <tr>
            <td style="padding: 16px; text-align: center;">
              <p class="email-text" style="margin: 0 0 4px 0; font-size: 24px; font-weight: 600; color: ${colors.text};">${m.value}</p>
              <p class="email-text-muted" style="margin: 0; font-size: 13px; color: ${colors.textMuted};">${m.label}</p>
              ${m.change ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: ${changeColor};">${m.change}</p>` : ''}
            </td>
          </tr>
        </table>
      </td>
    `;
  });
  
  // Build 2x2 grid rows
  const rows: string[] = [];
  for (let i = 0; i < metricsHtml.length; i += 2) {
    const cell1 = metricsHtml[i] || '';
    const cell2 = metricsHtml[i + 1] || '<td width="50%"></td>';
    rows.push(`<tr>${cell1}${cell2}</tr>`);
  }
  
  const content = `
    ${heading(data.reportName)}
    ${paragraph(`Here's your report for ${data.dateRange}.`)}
    
    <!-- Metrics Grid - 2 columns -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      ${rows.join('')}
    </table>
    
    ${spacer(24)}
    ${button('Review Analytics', data.viewReportUrl)}
  `;
  
  return generateWrapper({
    preheaderText: `Your ${data.reportName} for ${data.dateRange} is ready`,
    content,
    unsubscribeUrl: 'https://app.getpilot.io/settings?tab=notifications#report-emails',
  });
}

export function generatePasswordResetEmail(data: PasswordResetData): string {
  const greeting = data.userName ? `Hi ${data.userName},` : 'Hi,';
  const expiryNote = data.expiresIn 
    ? `This link will expire in ${data.expiresIn}.`
    : 'This link will expire in 1 hour.';
  
  const content = `
    ${heading('Reset your password')}
    ${paragraph(`${greeting} we received a request to reset your password.`)}
    ${paragraph('Click the button below to choose a new password:', true)}
    ${spacer(8)}
    ${button('Reset Password', data.resetUrl)}
    ${spacer(24)}
    ${paragraph(expiryNote, true)}
    ${paragraph("If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.", true)}
  `;
  
  return generateWrapper({
    preheaderText: 'Reset your Pilot password',
    content,
  });
}

export function generateEmailVerificationEmail(data: EmailVerificationData): string {
  const greeting = data.userName ? `Welcome ${data.userName}!` : 'Welcome!';
  const expiryNote = data.expiresIn 
    ? `This link will expire in ${data.expiresIn}.`
    : 'This link will expire in 24 hours.';
  
  const content = `
    ${heading('Verify your email')}
    ${paragraph(`${greeting} Thanks for signing up for Pilot. Please verify your email address to get started.`)}
    ${spacer(8)}
    ${button('Verify Email', data.verificationUrl)}
    ${spacer(24)}
    ${paragraph(expiryNote, true)}
    ${paragraph("If you didn't create a Pilot account, you can safely ignore this email.", true)}
  `;
  
  return generateWrapper({
    preheaderText: 'Verify your email to get started with Pilot',
    content,
  });
}

// =============================================================================
// NEW TEMPLATES - HIGH PRIORITY
// =============================================================================

export function generateBookingCancellationEmail(data: BookingCancellationData): string {
  const content = `
    ${heading('Your booking has been cancelled')}
    ${paragraph(`Hi <strong>${data.visitorName}</strong>, your appointment has been cancelled.`)}
    
    <!-- Cancelled Event Card -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-detail-bg email-bg" style="background-color: ${colors.background}; border-radius: 8px;">
      <tr>
        <td style="padding: 20px;">
          <p class="email-text" style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: ${colors.text}; text-decoration: line-through; opacity: 0.6;">${data.eventType}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${detailRow('Date', data.date)}
            ${detailRow('Time', `${data.time} (${data.timezone})`)}
            ${data.reason ? detailRow('Reason', data.reason) : ''}
          </table>
        </td>
      </tr>
    </table>
    
    ${data.rescheduleUrl ? `
      ${spacer(24)}
      ${paragraph('Would you like to book a new appointment?', true)}
      ${button('Reschedule', data.rescheduleUrl)}
    ` : ''}
  `;
  
  return generateWrapper({
    preheaderText: `Your ${data.eventType} on ${data.date} has been cancelled`,
    content,
    unsubscribeUrl: 'https://app.getpilot.io/settings?tab=notifications#booking-emails',
  });
}

export function generateBookingReminderEmail(data: BookingReminderData): string {
  const content = `
    ${heading('Reminder: Your appointment is coming up')}
    ${paragraph(`Hi <strong>${data.visitorName}</strong>, this is a friendly reminder that your appointment is in <strong>${data.reminderTime}</strong>.`)}
    
    <!-- Event Card -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-detail-bg email-bg" style="background-color: ${colors.background}; border-radius: 8px;">
      <tr>
        <td style="padding: 20px;">
          <p class="email-text" style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: ${colors.text};">${data.eventType}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${detailRow('Date', data.date)}
            ${detailRow('Time', `${data.time} (${data.timezone})`)}
            ${data.location ? detailRow('Location', data.location) : ''}
          </table>
        </td>
      </tr>
    </table>
    
    ${data.calendarLink ? `${spacer(24)}${button('View in Calendar', data.calendarLink)}` : ''}
  `;
  
  return generateWrapper({
    preheaderText: `Reminder: ${data.eventType} on ${data.date} at ${data.time}`,
    content,
    unsubscribeUrl: 'https://app.getpilot.io/settings?tab=notifications#booking-emails',
  });
}

export function generateNewLeadNotificationEmail(data: NewLeadNotificationData): string {
  const source = data.source || 'Ari Agent';
  
  const content = `
    ${heading('You have a new lead')}
    ${paragraph('View the lead to see more details.')}
    
    <!-- Lead Card -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-detail-bg email-bg" style="background-color: ${colors.background}; border-radius: 8px;">
      <tr>
        <td style="padding: 20px;">
          <p class="email-text" style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: ${colors.text};">${data.leadName}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${data.leadEmail ? detailRow('Email', data.leadEmail) : ''}
            ${data.leadPhone ? detailRow('Phone', data.leadPhone) : ''}
            ${detailRow('Source', source)}
          </table>
          ${data.message ? `
            ${spacer(12)}
            <p class="email-text-muted" style="margin: 0; font-size: 14px; font-style: italic; color: ${colors.textMuted};">"${data.message}"</p>
          ` : ''}
        </td>
      </tr>
    </table>
    
    ${spacer(24)}
    ${button('View Lead', data.viewLeadUrl)}
  `;
  
  return generateWrapper({
    preheaderText: `New lead: ${data.leadName} from ${source}`,
    content,
    unsubscribeUrl: 'https://app.getpilot.io/settings?tab=notifications#lead-emails',
  });
}

// =============================================================================
// NEW TEMPLATES - MEDIUM PRIORITY
// =============================================================================

export function generateWelcomeEmail(data: WelcomeEmailData): string {
  const companyNote = data.companyName 
    ? ` We're excited to have ${data.companyName} on board.`
    : '';
  
  const content = `
    ${heading(`Welcome to Pilot, ${data.userName}!`)}
    ${paragraph(`Thanks for joining Pilot.${companyNote}`)}
    ${paragraph('Pilot helps you manage conversations, capture leads, and provide AI-powered customer support—all in one place.', true)}
    
    <!-- Quick Start -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-detail-bg email-bg" style="background-color: ${colors.background}; border-radius: 8px;">
      <tr>
        <td style="padding: 20px;">
          <p class="email-text" style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: ${colors.text};">Get started in 3 steps:</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td class="email-text" style="padding: 8px 0; font-size: 14px; color: ${colors.text};">1. Set up your AI agent</td>
            </tr>
            <tr>
              <td class="email-text" style="padding: 8px 0; font-size: 14px; color: ${colors.text};">2. Add your knowledge base</td>
            </tr>
            <tr>
              <td class="email-text" style="padding: 8px 0; font-size: 14px; color: ${colors.text};">3. Install the widget on your site</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    ${spacer(24)}
    ${button('Get Started', data.getStartedUrl)}
    ${spacer(16)}
    ${paragraph("Need help? Reply to this email and we'll get back to you.", true)}
  `;
  
  return generateWrapper({
    preheaderText: `Welcome to Pilot, ${data.userName}! Let's get you set up.`,
    content,
  });
}

export function generateBookingRescheduledEmail(data: BookingRescheduledData): string {
  const content = `
    ${heading('Your booking has been rescheduled')}
    ${paragraph(`Hi <strong>${data.visitorName}</strong>, your appointment has been moved to a new time.`)}
    
    <!-- Old Time (crossed out) -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-radius: 8px; border: 1px dashed ${colors.border};">
      <tr>
        <td style="padding: 16px;">
          <p class="email-text-muted" style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.textMuted};">Previous Time</p>
          <p class="email-text" style="margin: 0; font-size: 16px; color: ${colors.text}; text-decoration: line-through; opacity: 0.6;">${data.oldDate} at ${data.oldTime}</p>
        </td>
      </tr>
    </table>
    
    ${spacer(16)}
    
    <!-- New Time -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-detail-bg email-bg" style="background-color: ${colors.background}; border-radius: 8px;">
      <tr>
        <td style="padding: 20px;">
          <p class="email-text-muted" style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.textMuted};">New Time</p>
          <p class="email-text" style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: ${colors.text};">${data.eventType}</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${detailRow('Date', data.newDate)}
            ${detailRow('Time', `${data.newTime} (${data.timezone})`)}
          </table>
        </td>
      </tr>
    </table>
    
    ${data.calendarLink ? `${spacer(24)}${button('Update Calendar', data.calendarLink)}` : ''}
  `;
  
  return generateWrapper({
    preheaderText: `Your ${data.eventType} has been rescheduled to ${data.newDate} at ${data.newTime}`,
    content,
    unsubscribeUrl: 'https://app.getpilot.io/settings?tab=notifications#booking-emails',
  });
}

export function generateWebhookFailureAlertEmail(data: WebhookFailureAlertData): string {
  const content = `
    ${heading('Webhook delivery failed')}
    ${alertBox(`Failed to deliver to <strong>${data.webhookName}</strong> after ${data.retryCount} retries.`, 'error')}
    ${spacer(16)}
    
    <!-- Error Details -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-detail-bg email-bg" style="background-color: ${colors.background}; border-radius: 8px;">
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${detailRow('Endpoint', data.endpoint)}
            ${detailRow('Error Code', String(data.errorCode))}
            ${detailRow('Failed At', data.failedAt)}
            ${detailRow('Retries', String(data.retryCount))}
          </table>
          ${spacer(12)}
          <p class="email-text-muted" style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.textMuted};">Error Message</p>
          <p class="email-text" style="margin: 0; font-size: 13px; font-family: monospace; padding: 8px; background-color: ${colors.card}; border-radius: 4px; color: ${colors.error};">${data.errorMessage}</p>
        </td>
      </tr>
    </table>
    
    ${spacer(24)}
    ${button('Configure Webhook', data.configureUrl)}
  `;
  
  return generateWrapper({
    preheaderText: `Webhook failed: ${data.webhookName} - Error ${data.errorCode}`,
    content,
    unsubscribeUrl: 'https://app.getpilot.io/settings?tab=notifications#agent-emails',
  });
}

// =============================================================================
// NEW TEMPLATES - LOWER PRIORITY
// =============================================================================

export function generateTeamMemberRemovedEmail(data: TeamMemberRemovedData): string {
  const content = `
    ${heading('Removed from team')}
    ${paragraph(`Hi <strong>${data.memberName}</strong>, you have been removed from <strong>${data.companyName}</strong>.`)}
    ${spacer(8)}
    ${paragraph('You no longer have access to this team\'s resources. If you believe this was a mistake, please contact your team administrator.', true)}
  `;
  
  return generateWrapper({
    preheaderText: `You've been removed from ${data.companyName}`,
    content,
    unsubscribeUrl: 'https://app.getpilot.io/settings?tab=notifications#team-emails',
  });
}

export function generateFeatureAnnouncementEmail(data: FeatureAnnouncementData): string {
  const content = `
    ${heading(data.featureTitle)}
    ${data.imageUrl ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding-bottom: 24px;">
            <img src="${data.imageUrl}" alt="${data.featureTitle}" width="100%" style="display: block; border-radius: 8px; max-width: 100%;">
          </td>
        </tr>
      </table>
    ` : ''}
    ${paragraph(data.description)}
    ${spacer(8)}
    ${button('Learn More', data.learnMoreUrl)}
  `;
  
  return generateWrapper({
    preheaderText: `New in Pilot: ${data.featureTitle}`,
    content,
    unsubscribeUrl: 'https://app.getpilot.io/settings?tab=notifications#product-emails',
  });
}
