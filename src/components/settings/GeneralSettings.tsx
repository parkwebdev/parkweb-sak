import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Palette } from '@untitledui/icons';

export const GeneralSettings: React.FC = () => {
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);

  const handleSave = async () => {
    setUpdating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Settings saved",
      description: "Your general settings have been updated.",
    });
    setUpdating(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Application Preferences</CardTitle>
          <CardDescription className="text-xs">Customize your application experience</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Palette size={14} className="text-muted-foreground" />
                <label className="text-sm font-medium">Theme</label>
              </div>
              <p className="text-xs text-muted-foreground">Choose your preferred color scheme</p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updating} size="sm">
          {updating ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};