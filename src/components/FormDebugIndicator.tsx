import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FormDebugIndicatorProps {
  data: any;
  isFreshStart: boolean;
  visible?: boolean;
}

export const FormDebugIndicator: React.FC<FormDebugIndicatorProps> = ({ 
  data, 
  isFreshStart, 
  visible = process.env.NODE_ENV === 'development' 
}) => {
  if (!visible) return null;

  const hasUnsavedChanges = !!localStorage.getItem('onboardingDraft');
  
  return (
    <Card className="fixed bottom-4 right-4 w-80 bg-muted/90 backdrop-blur-sm border-dashed z-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">🔧 Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span>Fresh Start:</span>
          <Badge variant={isFreshStart ? "default" : "secondary"}>
            {isFreshStart ? "Yes" : "No"}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span>Current Step:</span>
          <Badge variant="outline">{data.currentStep}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span>Draft Saved:</span>
          <Badge variant={hasUnsavedChanges ? "default" : "secondary"}>
            {hasUnsavedChanges ? "Yes" : "No"}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span>Company:</span>
          <span className="truncate max-w-24">{data.companyName || "Empty"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Contact:</span>
          <span className="truncate max-w-24">{data.contactName || "Empty"}</span>
        </div>
      </CardContent>
    </Card>
  );
};