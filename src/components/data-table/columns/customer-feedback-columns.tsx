import { ColumnDef } from "@tanstack/react-table";
import { Star01, ArrowNarrowRight } from "@untitledui/icons";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTableColumnHeader } from "../DataTableColumnHeader";
import { cn } from "@/lib/utils";

export interface CustomerFeedbackData {
  id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback: string | null;
  createdAt: string;
  triggerType: string;
  conversationId: string;
}

/**
 * Get sentiment color classes based on rating
 * 4-5: Positive (green), 3: Neutral (yellow), 1-2: Negative (red)
 */
const getSentimentClasses = (rating: number) => {
  if (rating >= 4) {
    return "text-status-active"; // Green for positive
  }
  if (rating === 3) {
    return "text-yellow-500"; // Yellow for neutral
  }
  return "text-destructive"; // Red for negative
};

const StarRating = ({ rating }: { rating: number }) => {
  const sentimentClass = getSentimentClasses(rating);
  
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star01
          key={star}
          size={14}
          className={cn(
            star <= rating ? `${sentimentClass} fill-current` : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
};

const getTriggerLabel = (triggerType: string): string => {
  switch (triggerType) {
    case "conversation_end":
      return "End of chat";
    case "manual":
      return "Manual";
    case "inactivity":
      return "Inactivity";
    case "escalation":
      return "Escalation";
    default:
      return triggerType || "Unknown";
  }
};

export const customerFeedbackColumns: ColumnDef<CustomerFeedbackData>[] = [
  {
    accessorKey: "rating",
    size: 100,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rating" />
    ),
    cell: ({ row }) => <StarRating rating={row.original.rating} />,
  },
  {
    accessorKey: "feedback",
    header: "Feedback",
    cell: ({ row }) => {
      const feedback = row.original.feedback;
      if (!feedback) return <span className="text-muted-foreground">—</span>;
      
      const truncated = feedback.length > 80;
      const displayText = truncated ? `${feedback.slice(0, 80)}...` : feedback;
      
      if (truncated) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">{displayText}</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-sm">
              <p>{feedback}</p>
            </TooltipContent>
          </Tooltip>
        );
      }
      
      return <span>{displayText}</span>;
    },
  },
  {
    accessorKey: "createdAt",
    size: 120,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-muted-foreground cursor-help">
              {formatDistanceToNow(date, { addSuffix: true })}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{format(date, "PPp")}</p>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: "triggerType",
    size: 100,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trigger" />
    ),
    cell: ({ row }) => (
      <Badge variant="secondary" className="text-2xs font-normal">
        {getTriggerLabel(row.original.triggerType)}
      </Badge>
    ),
  },
  {
    id: "actions",
    size: 60,
    cell: ({ row }) => (
      <IconButton
        variant="ghost"
        size="sm"
        label="View conversation"
        onClick={() => {
          window.location.href = `/conversations?id=${row.original.conversationId}`;
        }}
      >
        <ArrowNarrowRight size={16} />
      </IconButton>
    ),
  },
];
