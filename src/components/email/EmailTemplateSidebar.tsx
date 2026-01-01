import { useState } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { 
  Mail01, Calendar, File02, Key01, Phone01, Monitor01, Moon01, Sun,
  XCircle, Clock, Users01, UserPlus01, RefreshCw01,
  AlertTriangle, UserMinus01, Announcement01, InfoCircle
} from '@untitledui/icons';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

/** Supabase brand icon */
function SupabaseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 109 113" fill="none" className={className}>
      <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#sb_paint0)"/>
      <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="url(#sb_paint1)" fillOpacity="0.2"/>
      <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#3ECF8E"/>
      <defs>
        <linearGradient id="sb_paint0" x1="53.9738" y1="54.974" x2="94.1635" y2="71.8295" gradientUnits="userSpaceOnUse">
          <stop stopColor="#249361"/><stop offset="1" stopColor="#3ECF8E"/>
        </linearGradient>
        <linearGradient id="sb_paint1" x1="36.1558" y1="30.578" x2="54.4844" y2="65.0806" gradientUnits="userSpaceOnUse">
          <stop/><stop offset="1" stopOpacity="0"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

/** Resend brand icon */
function ResendIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 600" fill="none" className={className}>
      <path d="M186 447.471V154H318.062C336.788 154 353.697 158.053 368.79 166.158C384.163 174.263 396.181 185.443 404.845 199.698C413.51 213.672 417.842 229.604 417.842 247.491C417.842 265.938 413.51 282.568 404.845 297.381C396.181 311.915 384.302 323.375 369.209 331.759C354.117 340.144 337.067 344.337 318.062 344.337H253.917V447.471H186ZM348.667 447.471L274.041 314.99L346.99 304.509L430 447.471H348.667ZM253.917 289.835H311.773C319.04 289.835 325.329 288.298 330.639 285.223C336.229 281.869 340.421 277.258 343.216 271.388C346.291 265.519 347.828 258.811 347.828 251.265C347.828 243.718 346.151 237.15 342.797 231.56C339.443 225.691 334.552 221.219 328.124 218.144C321.975 215.07 314.428 213.533 305.484 213.533H253.917V289.835Z" fill="currentColor"/>
    </svg>
  );
}
export type EmailTemplateType = 
  | 'invitation' 
  | 'booking' 
  | 'report' 
  | 'weekly-report'
  | 'password-reset' 
  | 'signup-confirmation'
  | 'booking-cancellation'
  | 'booking-reminder'
  | 'new-lead'
  | 'human-takeover'
  | 'welcome'
  | 'booking-rescheduled'
  | 'lead-status-change'
  | 'webhook-failure'
  | 'team-member-removed'
  | 'feature-announcement';

export type PreviewWidth = 'mobile' | 'desktop';

/** Delivery method for each email template */
type DeliveryMethod = 'supabase' | 'resend';

interface TemplateItem {
  id: EmailTemplateType;
  label: string;
  icon: typeof Mail01;
  group: string;
  status?: 'integrated' | 'ready';
  /** How this email is sent - Supabase Auth or Resend edge function */
  delivery: DeliveryMethod;
}

const TEMPLATES: TemplateItem[] = [
  // Auth - Supabase handles Password Reset and Signup Confirmation
  { id: 'password-reset', label: 'Password Reset', icon: Key01, group: 'Auth', status: 'integrated', delivery: 'supabase' },
  { id: 'signup-confirmation', label: 'Signup Confirmation', icon: Mail01, group: 'Auth', status: 'integrated', delivery: 'supabase' },
  { id: 'welcome', label: 'Welcome', icon: UserPlus01, group: 'Auth', status: 'integrated', delivery: 'resend' },
  
  // Team - Invitation is Supabase Invite User, Member Removed is Resend
  { id: 'invitation', label: 'Team Invitation', icon: Mail01, group: 'Team', status: 'integrated', delivery: 'supabase' },
  { id: 'team-member-removed', label: 'Member Removed', icon: UserMinus01, group: 'Team', status: 'integrated', delivery: 'resend' },
  
  // Transactional - Bookings (Resend)
  { id: 'booking', label: 'Booking Confirmation', icon: Calendar, group: 'Bookings', delivery: 'resend' },
  { id: 'booking-cancellation', label: 'Booking Cancelled', icon: XCircle, group: 'Bookings', delivery: 'resend' },
  { id: 'booking-rescheduled', label: 'Booking Rescheduled', icon: RefreshCw01, group: 'Bookings', delivery: 'resend' },
  { id: 'booking-reminder', label: 'Booking Reminder', icon: Clock, group: 'Bookings', delivery: 'resend' },
  
  // Leads & Conversations (Resend)
  { id: 'new-lead', label: 'New Lead', icon: Users01, group: 'Leads', status: 'integrated', delivery: 'resend' },
  
  // Alerts (Resend)
  { id: 'webhook-failure', label: 'Webhook Failure', icon: AlertTriangle, group: 'Alerts', delivery: 'resend' },
  
  // Reports & Product (Resend)
  { id: 'report', label: 'Scheduled Report', icon: File02, group: 'Reports', status: 'integrated', delivery: 'resend' },
  { id: 'weekly-report', label: 'Weekly Report', icon: File02, group: 'Reports', status: 'integrated', delivery: 'resend' },
  { id: 'feature-announcement', label: 'Feature Announcement', icon: Announcement01, group: 'Product', delivery: 'resend' },
];

interface EmailTemplateSidebarProps {
  activeTemplate: EmailTemplateType;
  onTemplateChange: (template: EmailTemplateType) => void;
  previewWidth: PreviewWidth;
  onPreviewWidthChange: (width: PreviewWidth) => void;
  darkMode: boolean;
  onDarkModeChange: (dark: boolean) => void;
}

export function EmailTemplateSidebar({ 
  activeTemplate, 
  onTemplateChange,
  previewWidth,
  onPreviewWidthChange,
  darkMode,
  onDarkModeChange,
}: EmailTemplateSidebarProps) {
  const prefersReducedMotion = useReducedMotion();
  const [hoveredDevice, setHoveredDevice] = useState<PreviewWidth | null>(null);
  const [hoveredTheme, setHoveredTheme] = useState<'light' | 'dark' | null>(null);

  // Group templates by their group
  const groupedTemplates = TEMPLATES.reduce((acc, template) => {
    if (!acc[template.group]) {
      acc[template.group] = [];
    }
    acc[template.group].push(template);
    return acc;
  }, {} as Record<string, TemplateItem[]>);

  const groupOrder = ['Auth', 'Team', 'Bookings', 'Leads', 'Alerts', 'Reports', 'Product'];

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-card overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Templates</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Select a template to preview</p>
      </div>

      {/* Preview Controls */}
      <div className="px-3 py-4 space-y-3">
        {/* Width Toggle */}
        <div className="space-y-1.5">
          <span className="text-2xs font-medium text-muted-foreground uppercase tracking-wider px-1">Device</span>
          <div 
            className="relative flex rounded-lg border overflow-hidden"
            onMouseLeave={() => setHoveredDevice(null)}
          >
            <motion.div
              className="absolute inset-y-0 bg-muted"
              style={{ width: '50%' }}
              initial={false}
              animate={{
                x: (hoveredDevice ?? previewWidth) === 'desktop' ? '100%' : '0%',
              }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 35,
              }}
            />
            <button
              type="button"
              onClick={() => onPreviewWidthChange('mobile')}
              onMouseEnter={() => setHoveredDevice('mobile')}
              className={cn(
                'relative z-10 flex h-8 items-center justify-center gap-1.5 px-3 transition-colors text-sm flex-1',
                previewWidth === 'mobile'
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Phone01 size={14} />
              <span>Mobile</span>
            </button>
            <button
              type="button"
              onClick={() => onPreviewWidthChange('desktop')}
              onMouseEnter={() => setHoveredDevice('desktop')}
              className={cn(
                'relative z-10 flex h-8 items-center justify-center gap-1.5 px-3 transition-colors text-sm flex-1',
                previewWidth === 'desktop'
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Monitor01 size={14} />
              <span>Desktop</span>
            </button>
          </div>
        </div>

        {/* Dark Mode Toggle */}
        <div className="space-y-1.5">
          <span className="text-2xs font-medium text-muted-foreground uppercase tracking-wider px-1">Theme</span>
          <div 
            className="relative flex rounded-lg border overflow-hidden"
            onMouseLeave={() => setHoveredTheme(null)}
          >
            <motion.div
              className="absolute inset-y-0 bg-muted"
              style={{ width: '50%' }}
              initial={false}
              animate={{
                x: (hoveredTheme ?? (darkMode ? 'dark' : 'light')) === 'dark' ? '100%' : '0%',
              }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 35,
              }}
            />
            <button
              type="button"
              onClick={() => onDarkModeChange(false)}
              onMouseEnter={() => setHoveredTheme('light')}
              className={cn(
                'relative z-10 flex h-8 items-center justify-center gap-1.5 px-3 transition-colors text-sm flex-1',
                !darkMode
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Sun size={14} />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => onDarkModeChange(true)}
              onMouseEnter={() => setHoveredTheme('dark')}
              className={cn(
                'relative z-10 flex h-8 items-center justify-center gap-1.5 px-3 transition-colors text-sm flex-1',
                darkMode
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Moon01 size={14} />
              <span>Dark</span>
            </button>
          </div>
        </div>
      </div>

      <Separator />
      
      <nav className="p-2 space-y-4 flex-1">
        {groupOrder.map((group, groupIndex) => {
          const templates = groupedTemplates[group];
          if (!templates) return null;

          return (
            <div key={group}>
              <h3 className="px-2 py-1 text-2xs font-medium text-muted-foreground uppercase tracking-wider">
                {group}
              </h3>
              <div className="mt-1 space-y-0.5">
                {templates.map((template, itemIndex) => {
                  const isActive = activeTemplate === template.id;
                  const Icon = template.icon;

                    return (
                      <motion.button
                        key={template.id}
                        onClick={() => onTemplateChange(template.id)}
                        initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.2,
                          delay: prefersReducedMotion ? 0 : groupIndex * 0.05 + itemIndex * 0.03,
                        }}
                        className={`
                          w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm
                          transition-colors duration-150
                          ${isActive 
                            ? 'bg-primary/10 text-primary font-medium' 
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }
                        `}
                      >
                        <Icon size={16} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                        <span className="flex-1 text-left truncate">{template.label}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Delivery method badge with brand icon */}
                          <span className="flex items-center gap-1 text-2xs px-1.5 py-0.5 rounded font-medium bg-neutral-500/10 text-neutral-600 dark:text-neutral-400">
                            {template.delivery === 'supabase' ? (
                              <SupabaseIcon className="h-3 w-3" />
                            ) : (
                              <ResendIcon className="h-3 w-3" />
                            )}
                          </span>
                          {/* Live status badge */}
                          {template.status === 'integrated' && (
                            <span className="text-2xs px-1 py-0.5 rounded bg-status-active/10 text-status-active font-medium">
                              Live
                            </span>
                          )}
                        </div>
                      </motion.button>
                    );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <Separator />

      {/* Legend */}
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger className="w-full p-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <InfoCircle size={14} />
          <span>Delivery Methods</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3">
          <div className="space-y-2 text-2xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <SupabaseIcon className="h-4 w-4 shrink-0" />
              <span>Configured in Supabase Dashboard → Auth → Email Templates</span>
            </div>
            <div className="flex items-center gap-2">
              <ResendIcon className="h-4 w-4 shrink-0" />
              <span>Sent via Edge Functions using Resend API</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </aside>
  );
}
