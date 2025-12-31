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

export interface NotificationData {
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  type?: 'scope_work' | 'onboarding' | 'system' | 'team' | 'security';
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
}

const generateWrapper = ({ preheaderText, content }: WrapperOptions): string => {
  const year = new Date().getFullYear();
  
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
              <p class="email-text" style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; color: ${colors.text};">Pilot</p>
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
              <p class="email-text-muted" style="margin: 0; font-size: 13px; line-height: 1.5; color: ${colors.textMuted};">© ${year} Pilot. All rights reserved.</p>
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

const button = (text: string, url: string): string => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="email-btn" style="border-radius: 6px; background-color: ${colors.buttonBg};">
        <a href="${url}" target="_blank" class="email-btn-text" style="display: inline-block; font-family: ${fonts.stack}; font-size: 14px; font-weight: 600; color: ${colors.buttonText}; text-decoration: none; padding: 12px 24px; border-radius: 6px;">${text}</a>
      </td>
    </tr>
  </table>
`;

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

// =============================================================================
// TEMPLATES
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
  });
}

export function generateNotificationEmail(data: NotificationData): string {
  const content = `
    ${heading(data.title)}
    ${paragraph(data.message)}
    ${data.actionUrl && data.actionLabel ? `${spacer(8)}${button(data.actionLabel, data.actionUrl)}` : ''}
  `;
  
  return generateWrapper({
    preheaderText: data.message.substring(0, 100),
    content,
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
  });
}

export function generateScheduledReportEmail(data: ScheduledReportData): string {
  const metricsHtml = data.metrics.map(m => {
    const changeColor = m.change?.startsWith('+') || m.change?.startsWith('↑') ? '#22c55e' 
      : m.change?.startsWith('-') || m.change?.startsWith('↓') ? '#ef4444' 
      : colors.textMuted;
    
    return `
      <td style="padding: 16px; text-align: center; vertical-align: top;">
        <p class="email-text" style="margin: 0 0 4px 0; font-size: 24px; font-weight: 600; color: ${colors.text};">${m.value}</p>
        <p class="email-text-muted" style="margin: 0; font-size: 13px; color: ${colors.textMuted};">${m.label}</p>
        ${m.change ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: ${changeColor};">${m.change}</p>` : ''}
      </td>
    `;
  }).join('');
  
  const content = `
    ${heading(data.reportName)}
    ${paragraph(`Here's your report for ${data.dateRange}.`)}
    
    <!-- Metrics Grid -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-detail-bg email-bg" style="background-color: ${colors.background}; border-radius: 8px;">
      <tr>${metricsHtml}</tr>
    </table>
    
    ${spacer(24)}
    ${button('View Full Report', data.viewReportUrl)}
  `;
  
  return generateWrapper({
    preheaderText: `Your ${data.reportName} for ${data.dateRange} is ready`,
    content,
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
