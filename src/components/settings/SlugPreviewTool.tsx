import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Lightbulb01 } from '@untitledui/icons';

interface SlugPreviewToolProps {
  currentSlug?: string;
}

export const SlugPreviewTool = ({ currentSlug }: SlugPreviewToolProps) => {
  const [testName, setTestName] = useState('');
  const [generatedSlug, setGeneratedSlug] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const generateSlug = (name: string): string => {
    let slug = name.toLowerCase().trim();
    slug = slug.replace(/[^a-z0-9\s-]/g, '');
    slug = slug.replace(/\s+/g, '-');
    slug = slug.replace(/-+/g, '-');
    slug = slug.replace(/^-+|-+$/g, '');
    return slug || 'org';
  };

  const generateSuggestions = (name: string, slug: string): string[] => {
    const suggestions: string[] = [];
    const words = name.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    
    if (words.length > 1) {
      // Acronym suggestion
      const acronym = words.map(w => w[0]).join('');
      if (acronym !== slug && acronym.length >= 2) {
        suggestions.push(acronym);
      }
      
      // First and last word
      if (words.length > 2) {
        const firstLast = `${words[0]}-${words[words.length - 1]}`;
        if (firstLast !== slug) {
          suggestions.push(firstLast);
        }
      }
      
      // Remove common words
      const meaningfulWords = words.filter(w => 
        !['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with'].includes(w)
      );
      if (meaningfulWords.length > 0 && meaningfulWords.length < words.length) {
        const cleanSlug = meaningfulWords.join('-');
        if (cleanSlug !== slug) {
          suggestions.push(cleanSlug);
        }
      }
    }
    
    return suggestions.slice(0, 3);
  };

  const validateSlug = (slug: string): { valid: boolean; message: string; type: 'success' | 'error' | 'warning' } => {
    if (!slug) {
      return { valid: false, message: 'Slug cannot be empty', type: 'error' };
    }
    if (slug.length < 3) {
      return { valid: false, message: 'Slug must be at least 3 characters', type: 'error' };
    }
    if (slug.length > 63) {
      return { valid: false, message: 'Slug is too long (max 63 characters)', type: 'error' };
    }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
      return { valid: false, message: 'Invalid characters in slug', type: 'error' };
    }
    if (slug.length < 5) {
      return { valid: true, message: 'Slug is valid but very short - consider a longer one for clarity', type: 'warning' };
    }
    if (slug.length > 40) {
      return { valid: true, message: 'Slug is valid but quite long - shorter slugs are easier to remember', type: 'warning' };
    }
    return { valid: true, message: 'Perfect! This slug is valid and well-formatted', type: 'success' };
  };

  useEffect(() => {
    if (testName) {
      const slug = generateSlug(testName);
      setGeneratedSlug(slug);
      setSuggestions(generateSuggestions(testName, slug));
    } else {
      setGeneratedSlug('');
      setSuggestions([]);
    }
  }, [testName]);

  const validation = generatedSlug ? validateSlug(generatedSlug) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb01 className="h-5 w-5" />
          Slug Preview & Testing Tool
        </CardTitle>
        <CardDescription>
          Test how different organization names convert to slugs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-name">Test Organization Name</Label>
          <Input
            id="test-name"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="Enter a name to preview its slug..."
          />
        </div>

        {generatedSlug && (
          <>
            <div className="space-y-2">
              <Label>Generated Slug</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-2 bg-muted rounded-md font-mono text-sm">
                  {generatedSlug}
                </div>
                {validation && (
                  validation.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                  )
                )}
              </div>
            </div>

            {validation && (
              <Alert variant={validation.type === 'error' ? 'destructive' : 'default'}>
                <AlertDescription className="flex items-start gap-2">
                  {validation.type === 'success' && <CheckCircle className="h-4 w-4 mt-0.5 text-green-500" />}
                  {validation.type === 'warning' && <AlertCircle className="h-4 w-4 mt-0.5 text-yellow-500" />}
                  {validation.type === 'error' && <AlertCircle className="h-4 w-4 mt-0.5" />}
                  <span>{validation.message}</span>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Preview URL</Label>
              <div className="px-4 py-2 bg-muted rounded-md font-mono text-sm text-muted-foreground">
                {window.location.origin}/{generatedSlug}/agent-name
              </div>
            </div>

            {suggestions.length > 0 && (
              <div className="space-y-2">
                <Label>Alternative Suggestions</Label>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setTestName(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Click a suggestion to preview it
                </p>
              </div>
            )}

            {currentSlug && generatedSlug === currentSlug && (
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  This matches your current organization slug
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {!testName && (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb01 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              Enter an organization name above to see how it converts to a URL slug
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
