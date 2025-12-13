/**
 * AriPreviewColumn Component
 * 
 * Right column containing the chat widget preview.
 * Fixed width with responsive collapse behavior.
 * 
 * @module components/agents/AriPreviewColumn
 */

import React from 'react';
import { ChatWidget } from '@/widget/ChatWidget';
import type { WidgetConfig } from '@/widget/api';

interface AriPreviewColumnProps {
  widgetConfig: WidgetConfig | null;
}

export const AriPreviewColumn: React.FC<AriPreviewColumnProps> = ({
  widgetConfig,
}) => {
  if (!widgetConfig) return null;

  return (
    <div className="w-[375px] flex-shrink-0 border-l bg-muted/20 hidden xl:flex flex-col items-center justify-center relative">
      {/* Preview label */}
      <div className="absolute top-4 left-0 right-0 text-center">
        <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
          Live Preview
        </span>
      </div>
      
      {/* Widget container */}
      <div className="relative">
        <ChatWidget 
          key={`${widgetConfig.agentId}-${widgetConfig.position}`}
          config={widgetConfig} 
          previewMode={true}
          containedPreview={true}
        />
      </div>
    </div>
  );
};
