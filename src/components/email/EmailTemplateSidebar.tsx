import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Mail01, Bell01, Calendar, File02, Key01, CheckCircle, Phone01, Monitor01, Moon01, Sun } from '@untitledui/icons';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export type EmailTemplateType = 'invitation' | 'notification' | 'booking' | 'report' | 'password-reset' | 'email-verification';
export type PreviewWidth = 'mobile' | 'desktop';

interface TemplateItem {
  id: EmailTemplateType;
  label: string;
  icon: typeof Mail01;
  group: string;
}

const TEMPLATES: TemplateItem[] = [
  { id: 'invitation', label: 'Team Invitation', icon: Mail01, group: 'Transactional' },
  { id: 'booking', label: 'Booking Confirmation', icon: Calendar, group: 'Transactional' },
  { id: 'notification', label: 'Notification', icon: Bell01, group: 'Notifications' },
  { id: 'report', label: 'Scheduled Report', icon: File02, group: 'Reports' },
  { id: 'password-reset', label: 'Password Reset', icon: Key01, group: 'Auth' },
  { id: 'email-verification', label: 'Email Verification', icon: CheckCircle, group: 'Auth' },
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

  // Group templates by their group
  const groupedTemplates = TEMPLATES.reduce((acc, template) => {
    if (!acc[template.group]) {
      acc[template.group] = [];
    }
    acc[template.group].push(template);
    return acc;
  }, {} as Record<string, TemplateItem[]>);

  const groupOrder = ['Auth', 'Transactional', 'Notifications', 'Reports'];

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-card overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Templates</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Select a template to preview</p>
      </div>

      {/* Preview Controls */}
      <div className="p-3 space-y-3">
        {/* Width Toggle */}
        <div className="space-y-1.5">
          <span className="text-2xs font-medium text-muted-foreground uppercase tracking-wider px-1">Device</span>
          <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5">
            <Button
              variant={previewWidth === 'mobile' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onPreviewWidthChange('mobile')}
              className="h-7 text-xs px-3 flex-1"
            >
              <Phone01 size={14} className="mr-1.5" />
              Mobile
            </Button>
            <Button
              variant={previewWidth === 'desktop' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onPreviewWidthChange('desktop')}
              className="h-7 text-xs px-3 flex-1"
            >
              <Monitor01 size={14} className="mr-1.5" />
              Desktop
            </Button>
          </div>
        </div>

        <Separator />

        {/* Dark Mode Toggle */}
        <div className="space-y-1.5">
          <span className="text-2xs font-medium text-muted-foreground uppercase tracking-wider px-1">Theme</span>
          <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5">
            <Button
              variant={!darkMode ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onDarkModeChange(false)}
              className="h-7 text-xs px-3 flex-1"
            >
              <Sun size={14} className="mr-1.5" />
              Light
            </Button>
            <Button
              variant={darkMode ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onDarkModeChange(true)}
              className="h-7 text-xs px-3 flex-1"
            >
              <Moon01 size={14} className="mr-1.5" />
              Dark
            </Button>
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
                        w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm
                        transition-colors duration-150
                        ${isActive 
                          ? 'bg-primary/10 text-primary font-medium' 
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }
                      `}
                    >
                      <Icon size={16} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                      <span>{template.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
