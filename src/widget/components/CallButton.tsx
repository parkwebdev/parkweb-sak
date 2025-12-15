/**
 * CallButton Component
 * 
 * Displays a clickable call button when phone numbers are detected in AI responses.
 * Uses tel: href for native phone dialing on mobile devices.
 * 
 * @module widget/components/CallButton
 */

import { Phone01 } from '../icons';

export interface CallAction {
  phoneNumber: string;      // E.164 or raw number for tel: href
  displayNumber: string;    // Human-readable format
  locationName?: string;    // Context: "Clearview Estates"
}

interface CallButtonProps {
  callActions: CallAction[];
}

export const CallButton = ({ callActions }: CallButtonProps) => {
  if (!callActions || callActions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-1 py-2 animate-fade-in">
      {callActions.map((action, idx) => (
        <a
          key={idx}
          href={`tel:${action.phoneNumber}`}
          className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-full border border-border bg-background hover:bg-accent transition-colors duration-150"
        >
          <Phone01 size={14} className="text-foreground" />
          <span className="text-foreground">
            {action.locationName ? `Call ${action.locationName}: ` : 'Call '}
            <span className="font-medium">{action.displayNumber}</span>
          </span>
        </a>
      ))}
    </div>
  );
};
