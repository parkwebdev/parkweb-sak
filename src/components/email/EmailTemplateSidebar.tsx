import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Mail01, Bell01, Calendar, File02, Key01, CheckCircle } from '@untitledui/icons';

export type EmailTemplateType = 'invitation' | 'notification' | 'booking' | 'report' | 'password-reset' | 'email-verification';

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
}

export function EmailTemplateSidebar({ activeTemplate, onTemplateChange }: EmailTemplateSidebarProps) {
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
    <aside className="w-60 shrink-0 border-r border-border bg-card overflow-y-auto">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Templates</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Select a template to preview</p>
      </div>
      
      <nav className="p-2 space-y-4">
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
