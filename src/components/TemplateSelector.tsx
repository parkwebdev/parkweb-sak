import { useState, useEffect } from 'react';
import { useOnboardingTemplates } from '@/hooks/useOnboardingTemplates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { File02 as FileText, ChevronRight } from '@untitledui/icons';
import { Skeleton } from '@/components/ui/skeleton';

interface TemplateSelectorProps {
  onSelectTemplate: (templateId: string) => void;
  selectedTemplateId?: string;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  selectedTemplateId,
}) => {
  const { templates, loading } = useOnboardingTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(selectedTemplateId);

  useEffect(() => {
    setSelectedTemplate(selectedTemplateId);
  }, [selectedTemplateId]);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    onSelectTemplate(templateId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Choose an Onboarding Template</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!templates.length) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Templates Available</h3>
          <p className="text-muted-foreground">
            No onboarding templates are currently available. Please contact your administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose an Onboarding Template</h3>
        <p className="text-muted-foreground">
          Select a template that best matches your client's industry and project type.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplate === template.id
                ? 'ring-2 ring-primary border-primary/50'
                : 'border-border hover:border-primary/30'
            }`}
            onClick={() => handleSelectTemplate(template.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {template.name}
                </CardTitle>
                <Badge variant="secondary">{template.industry}</Badge>
              </div>
              {template.description && (
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {template.form_fields && typeof template.form_fields === 'object' 
                    ? Object.keys(template.form_fields).length 
                    : 0} fields
                </div>
                <Button 
                  size="sm" 
                  variant={selectedTemplate === template.id ? "default" : "outline"}
                  className="text-xs"
                >
                  {selectedTemplate === template.id ? 'Selected' : 'Select'}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};