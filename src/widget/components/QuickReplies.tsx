/**
 * QuickReplies Component
 * 
 * Displays AI-generated quick reply suggestions as tappable chips.
 * Users can click to send the suggestion as their next message.
 * 
 * @module widget/components/QuickReplies
 */

interface QuickRepliesProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  primaryColor: string;
}

export const QuickReplies = ({ suggestions, onSelect, primaryColor }: QuickRepliesProps) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-1 py-2 animate-fade-in">
      {suggestions.map((suggestion, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(suggestion)}
          className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-accent transition-colors duration-150 text-left max-w-[200px] truncate"
          title={suggestion}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};
