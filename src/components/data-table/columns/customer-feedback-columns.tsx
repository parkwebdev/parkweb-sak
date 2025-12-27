import { ColumnDef } from "@tanstack/react-table";
import { Star01 } from "@untitledui/icons";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
export interface CustomerFeedbackData {
  id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback: string | null;
  createdAt: string;
  triggerType: string;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star01
        key={star}
        size={14}
        className={star <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}
      />
    ))}
  </div>
);

const getTriggerLabel = (triggerType: string): string => {
  switch (triggerType) {
    case "conversation_end":
      return "End of chat";
    case "manual":
      return "Manual";
    case "inactivity":
      return "Inactivity";
    default:
      return triggerType;
  }
};

export const customerFeedbackColumns: ColumnDef<CustomerFeedbackData>[] = [
  {
    accessorKey: "rating",
    header: "Rating",
    size: 100,
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
    header: "Date",
    size: 120,
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
    header: "Trigger",
    size: 100,
    cell: ({ row }) => (
      <Badge variant="secondary" className="text-2xs font-normal">
        {getTriggerLabel(row.original.triggerType)}
      </Badge>
    ),
  },
];
