/**
 * EmailTemplateEditor Component
 * 
 * Sheet for editing email templates.
 * 
 * @module components/admin/emails/EmailTemplateEditor
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { EmailTemplate } from '@/types/admin';

interface EmailTemplateEditorProps {
  /** Template to edit */
  template: EmailTemplate | null;
  /** Callback when template is saved */
  onSave: (template: Partial<EmailTemplate>) => Promise<void>;
  /** Callback when editor is closed */
  onClose: () => void;
  /** Whether save is in progress */
  isSaving?: boolean;
}

/**
 * Email template editor component.
 */
export function EmailTemplateEditor({
  template,
  onSave,
  onClose,
  isSaving,
}: EmailTemplateEditorProps) {
  const [formData, setFormData] = useState<Partial<EmailTemplate>>(
    template || {
      name: '',
      subject: '',
      html_content: '',
      text_content: '',
      active: true,
    }
  );

  const handleSave = async () => {
    await onSave(formData);
    onClose();
  };

  return (
    <Sheet open={!!template} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Template</SheetTitle>
          <SheetDescription>Update email template content</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Name</Label>
            <Input
              id="template-name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-subject">Subject</Label>
            <Input
              id="template-subject"
              value={formData.subject || ''}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-html">HTML Content</Label>
            <Textarea
              id="template-html"
              value={formData.html_content || ''}
              onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
              className="min-h-[200px] font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-text">Text Content</Label>
            <Textarea
              id="template-text"
              value={formData.text_content || ''}
              onChange={(e) => setFormData({ ...formData, text_content: e.target.value })}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
