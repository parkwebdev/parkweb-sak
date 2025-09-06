import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Globe01 as Globe, Palette } from '@untitledui/icons';

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe size={20} />
            Company Information
          </CardTitle>
          <CardDescription>Basic information about your company</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input id="company-name" placeholder="Agency" disabled={updating} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website-url">Website URL</Label>
              <Input id="website-url" type="url" placeholder="https://agency.com" disabled={updating} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Web design agency..." disabled={updating} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette size={20} />
            Application Preferences
          </CardTitle>
          <CardDescription>Customize your application experience</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Theme</h4>
              <p className="text-sm text-muted-foreground">Use the theme toggle in the sidebar</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updating}>
          {updating ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};