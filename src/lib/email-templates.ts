/**
 * Email Template Generators
 * 
 * Centralized email template HTML generators for preview and sending.
 * All templates use consistent branding and styling.
 */

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
  type: 'scope_work' | 'onboarding' | 'system' | 'team' | 'security';
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

const baseStyles = `
  body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #1a1a1a;
    margin: 0;
    padding: 0;
    background-color: #f5f5f5;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }
  .header {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    padding: 32px 40px;
    text-align: center;
  }
  .header h1 {
    color: #ffffff;
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }
  .content {
    padding: 40px;
  }
  .button {
    display: inline-block;
    background: #2563eb;
    color: #ffffff !important;
    padding: 14px 32px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    font-size: 16px;
    margin: 16px 0;
  }
  .button:hover {
    background: #1d4ed8;
  }
  .footer {
    padding: 24px 40px;
    background: #f9fafb;
    text-align: center;
    font-size: 14px;
    color: #6b7280;
  }
  .footer a {
    color: #2563eb;
    text-decoration: none;
  }
  .metric-card {
    background: #f9fafb;
    border-radius: 8px;
    padding: 16px;
    margin: 8px 0;
  }
  .metric-value {
    font-size: 28px;
    font-weight: 700;
    color: #1a1a1a;
  }
  .metric-label {
    font-size: 14px;
    color: #6b7280;
  }
  .metric-change {
    font-size: 14px;
    color: #10b981;
  }
  .metric-change.negative {
    color: #ef4444;
  }
`;

export function generateTeamInvitationEmail(data: TeamInvitationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Join ${data.companyName} on Pilot</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div style="padding: 20px;">
    <div class="container">
      <div class="header">
        <h1>You're Invited!</h1>
      </div>
      <div class="content">
        <p style="font-size: 18px; margin-bottom: 24px;">
          <strong>${data.invitedBy}</strong> has invited you to join <strong>${data.companyName}</strong> on Pilot.
        </p>
        <p style="color: #4b5563; margin-bottom: 32px;">
          Pilot helps teams build and deploy AI-powered chat agents. Accept this invitation to start collaborating with your team.
        </p>
        <div style="text-align: center;">
          <a href="${data.signupUrl}" class="button">Accept Invitation</a>
        </div>
        <p style="color: #9ca3af; font-size: 14px; margin-top: 32px;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
      </div>
      <div class="footer">
        <p>Sent by <a href="https://getpilot.io">Pilot</a></p>
        <p style="margin-top: 8px; font-size: 12px;">© ${new Date().getFullYear()} Pilot. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function generateNotificationEmail(data: NotificationData): string {
  const typeColors: Record<string, string> = {
    scope_work: '#8b5cf6',
    onboarding: '#10b981',
    system: '#6b7280',
    team: '#2563eb',
    security: '#ef4444',
  };
  
  const headerColor = typeColors[data.type] || '#2563eb';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <style>
    ${baseStyles}
    .header {
      background: linear-gradient(135deg, ${headerColor} 0%, ${headerColor}dd 100%);
    }
  </style>
</head>
<body>
  <div style="padding: 20px;">
    <div class="container">
      <div class="header">
        <h1>${data.title}</h1>
      </div>
      <div class="content">
        <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
          ${data.message}
        </p>
        ${data.actionUrl && data.actionLabel ? `
        <div style="text-align: center;">
          <a href="${data.actionUrl}" class="button">${data.actionLabel}</a>
        </div>
        ` : ''}
      </div>
      <div class="footer">
        <p>Sent by <a href="https://getpilot.io">Pilot</a></p>
        <p style="margin-top: 8px; font-size: 12px;">© ${new Date().getFullYear()} Pilot. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function generateBookingConfirmationEmail(data: BookingConfirmationData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div style="padding: 20px;">
    <div class="container">
      <div class="header">
        <h1>Booking Confirmed ✓</h1>
      </div>
      <div class="content">
        <p style="font-size: 18px; margin-bottom: 24px;">
          Hi <strong>${data.visitorName}</strong>, your ${data.eventType} has been confirmed!
        </p>
        
        <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 100px;">Date</td>
              <td style="padding: 8px 0; font-weight: 600;">${data.date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Time</td>
              <td style="padding: 8px 0; font-weight: 600;">${data.time} (${data.timezone})</td>
            </tr>
            ${data.location ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Location</td>
              <td style="padding: 8px 0; font-weight: 600;">${data.location}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        ${data.notes ? `
        <p style="color: #4b5563; font-size: 14px; margin-top: 16px;">
          <strong>Notes:</strong> ${data.notes}
        </p>
        ` : ''}
        
        ${data.calendarLink ? `
        <div style="text-align: center; margin-top: 24px;">
          <a href="${data.calendarLink}" class="button">Add to Calendar</a>
        </div>
        ` : ''}
      </div>
      <div class="footer">
        <p>Sent by <a href="https://getpilot.io">Pilot</a></p>
        <p style="margin-top: 8px; font-size: 12px;">© ${new Date().getFullYear()} Pilot. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function generateScheduledReportEmail(data: ScheduledReportData): string {
  const metricsHtml = data.metrics.map(metric => `
    <div class="metric-card">
      <div class="metric-value">${metric.value}</div>
      <div class="metric-label">${metric.label}</div>
      ${metric.change ? `<div class="metric-change ${metric.change.startsWith('-') ? 'negative' : ''}">${metric.change}</div>` : ''}
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.reportName}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div style="padding: 20px;">
    <div class="container">
      <div class="header">
        <h1>${data.reportName}</h1>
      </div>
      <div class="content">
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">
          Report for ${data.dateRange}
        </p>
        
        <div style="display: grid; gap: 12px;">
          ${metricsHtml}
        </div>
        
        <div style="text-align: center; margin-top: 32px;">
          <a href="${data.viewReportUrl}" class="button">View Full Report</a>
        </div>
      </div>
      <div class="footer">
        <p>Sent by <a href="https://getpilot.io">Pilot</a></p>
        <p style="margin-top: 8px; font-size: 12px;">© ${new Date().getFullYear()} Pilot. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
