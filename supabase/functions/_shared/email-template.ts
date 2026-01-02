/**
 * Shared Email Template Module
 * 
 * Centralized email template infrastructure for all Pilot email edge functions.
 * Provides design tokens, primitive components, and wrapper generators.
 */

// =============================================================================
// DESIGN TOKENS
// =============================================================================

export const LOGO_URL = 'https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/Email/Pilot%20Email%20Logo%20%40%20481px.png';
export const LINKEDIN_ICON_URL = 'https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/Email/LinkedIn%20Icon@4x.png';
export const FACEBOOK_ICON_URL = 'https://mvaimvwdukpgvkifkfpa.supabase.co/storage/v1/object/public/Email/Facebook%20Icon@4x.png';

export const colors = {
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#171717',
  textMuted: '#737373',
  border: '#e5e5e5',
  buttonBg: '#171717',
  buttonText: '#ffffff',
  success: '#22c55e',
  error: '#ef4444',
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

export const fonts = {
  stack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

// =============================================================================
// BASE STYLES
// =============================================================================

export const getBaseStyles = (): string => `
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
  
  .email-text-error { color: #ef4444 !important; }
  
  @media (prefers-color-scheme: dark) {
    .email-bg { background-color: ${colors.dark.background} !important; }
    .email-card { background-color: ${colors.dark.card} !important; }
    .email-text { color: ${colors.dark.text} !important; }
    .email-text-muted { color: ${colors.dark.textMuted} !important; }
    .email-text-error { color: #f87171 !important; }
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
// PRIMITIVE COMPONENTS
// =============================================================================

export const heading = (text: string): string => `
  <h1 class="email-text" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; line-height: 1.3; color: ${colors.text};">${text}</h1>
`;

export const paragraph = (text: string, muted = false): string => {
  const color = muted ? colors.textMuted : colors.text;
  const className = muted ? 'email-text-muted' : 'email-text';
  return `<p class="${className}" style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: ${color};">${text}</p>`;
};

export const button = (text: string, url: string): string => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td class="email-btn" style="border-radius: 6px; background-color: ${colors.buttonBg};">
        <a href="${url}" target="_blank" class="email-btn-text" style="display: inline-block; font-family: ${fonts.stack}; font-size: 14px; font-weight: 600; color: ${colors.buttonText}; text-decoration: none; padding: 12px 24px; border-radius: 6px;">${text}</a>
      </td>
    </tr>
  </table>
`;

export const spacer = (height = 24): string => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr><td style="height: ${height}px; font-size: 0; line-height: 0;">&nbsp;</td></tr>
  </table>
`;

export const detailRow = (label: string, value: string, labelWidth = 120): string => `
  <tr>
    <td class="email-text-muted" style="padding: 8px 0; font-size: 14px; color: ${colors.textMuted}; width: ${labelWidth}px; vertical-align: top;">${label}</td>
    <td class="email-text" style="padding: 8px 0; font-size: 14px; color: ${colors.text}; font-weight: 500;">${value}</td>
  </tr>
`;

export const alertBox = (text: string, type: 'warning' | 'error' | 'success' = 'warning'): string => {
  const colorMap = { warning: '#f59e0b', error: colors.error, success: colors.success };
  const bgColor = colorMap[type];
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: ${bgColor}10; border-left: 4px solid ${bgColor}; border-radius: 4px;">
    <tr>
      <td style="padding: 16px;">
        <p class="email-text" style="margin: 0; font-size: 14px; line-height: 1.5; color: ${colors.text};">${text}</p>
      </td>
    </tr>
  </table>`;
};

// =============================================================================
// FOOTER VARIANTS
// =============================================================================

type FooterType = 'simple' | 'social' | 'social-unsubscribe';

const generateFooterSimple = (year: number): string => `
  <p class="email-text-muted" style="margin: 0; font-size: 13px; line-height: 1.5; color: ${colors.textMuted};">© ${year} Pilot</p>
`;

const generateFooterSocial = (year: number): string => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="line-height: 1;">
    <tr>
      <td class="email-text-muted" style="font-size: 13px; color: ${colors.textMuted}; vertical-align: middle;">© ${year} Pilot</td>
      <td style="padding: 0 12px; vertical-align: middle;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="width: 1px; height: 13px; background-color: ${colors.border};"></td></tr></table>
      </td>
      <td style="vertical-align: middle;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="padding-right: 8px;">
            <a href="https://www.linkedin.com/company/getpilot" target="_blank" style="display: block; line-height: 0;">
              <img src="${LINKEDIN_ICON_URL}" alt="LinkedIn" height="14" style="display: block; height: 14px; width: auto;" />
            </a>
          </td>
          <td>
            <a href="https://www.facebook.com/getpilot" target="_blank" style="display: block; line-height: 0;">
              <img src="${FACEBOOK_ICON_URL}" alt="Facebook" height="14" style="display: block; height: 14px; width: auto;" />
            </a>
          </td>
        </tr></table>
      </td>
    </tr>
  </table>
`;

const generateFooterSocialUnsubscribe = (year: number, unsubscribeUrl: string): string => `
  ${generateFooterSocial(year)}
  <p class="email-text-muted" style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.5; color: ${colors.textMuted};"><a href="${unsubscribeUrl}" style="color: ${colors.textMuted}; text-decoration: underline;">Manage notification preferences</a></p>
`;

// =============================================================================
// WRAPPER OPTIONS & GENERATOR
// =============================================================================

export interface WrapperOptions {
  preheaderText: string;
  content: string;
  footer?: FooterType;
  unsubscribeUrl?: string;
}

export const generateWrapper = (options: WrapperOptions): string => {
  const { preheaderText, content, footer = 'simple', unsubscribeUrl } = options;
  const year = new Date().getFullYear();
  
  let footerHtml: string;
  switch (footer) {
    case 'social':
      footerHtml = generateFooterSocial(year);
      break;
    case 'social-unsubscribe':
      footerHtml = unsubscribeUrl 
        ? generateFooterSocialUnsubscribe(year, unsubscribeUrl)
        : generateFooterSocial(year);
      break;
    case 'simple':
    default:
      footerHtml = generateFooterSimple(year);
      break;
  }
  
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
                    <img src="${LOGO_URL}" alt="Pilot" width="20" height="20" style="display: block; width: 20px; height: 20px;" />
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
              ${footerHtml}
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
// LEGACY WRAPPER SUPPORT (for edge functions using old signature)
// =============================================================================

/**
 * Legacy wrapper function for edge functions using (preheaderText, content) signature
 * Uses simple footer without social icons
 */
export const generateWrapperSimple = (preheaderText: string, content: string): string => {
  return generateWrapper({ preheaderText, content, footer: 'simple' });
};
