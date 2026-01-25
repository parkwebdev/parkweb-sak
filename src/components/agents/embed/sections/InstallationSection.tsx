import { Link } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { BookOpen01 } from '@untitledui/icons';

interface InstallationSectionProps {
  embedCode: string;
}

export const InstallationSection = ({ embedCode }: InstallationSectionProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm">Embed Code</Label>
        <div className="relative">
          <Textarea
            value={embedCode}
            readOnly
            rows={10}
            className="font-mono text-xs pr-10"
          />
          <CopyButton 
            content={embedCode} 
            showToast={true} 
            toastMessage="Embed code copied to clipboard"
            className="absolute top-2 right-2"
          />
        </div>
      </div>

      <div className="space-y-3 p-4 bg-muted/50 rounded-card">
        <p className="text-sm font-medium">Installation Steps:</p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Copy the embed code above</li>
          <li>Paste it just before the closing <code className="bg-muted px-1 py-0.5 rounded">&lt;/body&gt;</code> tag on your website</li>
          <li>Save and publish your changes</li>
          <li>The chat widget will appear on your website</li>
        </ol>
      </div>

      <div className="space-y-3 p-4 bg-muted/50 rounded-card">
        <p className="text-sm font-medium">Need help?</p>
        <p className="text-sm text-muted-foreground">
          Check out our documentation for detailed integration guides for popular platforms like WordPress, Shopify, Webflow, and more.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/help-center">
            <BookOpen01 size={16} className="mr-1.5" aria-hidden="true" />
            Help Center
          </Link>
        </Button>
      </div>
    </div>
  );
};
