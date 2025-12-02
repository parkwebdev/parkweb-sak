import * as React from "react";
import { cn } from "@/lib/utils";

interface InfoCircleIconProps extends React.SVGAttributes<SVGSVGElement> {
  className?: string;
}

export const InfoCircleIcon = React.forwardRef<SVGSVGElement, InfoCircleIconProps>(
  ({ className, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        className={cn("group-hover:hidden", className)}
        {...props}
      >
        <path
          opacity={0.4}
          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path 
          d="M12 16V12M12 8H12.01" 
          stroke="currentColor" 
          strokeWidth={2} 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </svg>
    );
  }
);
InfoCircleIcon.displayName = "InfoCircleIcon";

export const InfoCircleIconFilled = React.forwardRef<SVGSVGElement, InfoCircleIconProps>(
  ({ className, ...props }, ref) => {
    return (
      <svg
        ref={ref}
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        className={cn("hidden group-hover:block", className)}
        {...props}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1ZM12 7C11.4477 7 11 7.44772 11 8C11 8.55228 11.4477 9 12 9H12.01C12.5623 9 13.01 8.55228 13.01 8C13.01 7.44772 12.5623 7 12.01 7H12ZM13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12V16C11 16.5523 11.4477 17 12 17C12.5523 17 13 16.5523 13 16V12Z"
          fill="currentColor"
        />
      </svg>
    );
  }
);
InfoCircleIconFilled.displayName = "InfoCircleIconFilled";
